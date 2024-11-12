import { useState, useEffect } from 'react';
import * as Automerge from 'automerge';

type Todo = { id: string; text: string; completed: boolean };

export const useTodosAutomerge = () => {
  const [todosDoc, setTodosDoc] = useState(Automerge.from<{ todos: Todo[] }>({ todos: [] }));
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    setWs(socket);

    socket.onmessage = (event) => {
      const remoteChanges = new Uint8Array(JSON.parse(event.data));
      setTodosDoc((doc) => Automerge.applyChanges(doc, [remoteChanges])[0]);
    };

    return () => {
      socket.close();
    };
  }, []);

  const addTodo = (text: string) => {
    setTodosDoc((doc) => Automerge.change(doc, (draft) => {
      draft.todos.push({ id: Date.now().toString(), text, completed: false });
    }));

    // Optimistic update: send changes to server immediately
    if (ws) {
      const changes = Automerge.getLastLocalChange(todosDoc);
      if (changes) ws.send(JSON.stringify(Array.from(changes)));
    }
  };

  return {
    todos: todosDoc.todos,
    addTodo,
  };
};
