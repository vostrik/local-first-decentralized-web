import { useState, useEffect } from 'react';
import * as Automerge from 'automerge';

type Todo = { id: string; text: string; completed: boolean };

const LOCAL_STORAGE_KEY = "todos-automerge-doc";

export const useTodosAutomerge = () => {
  const [todosDoc, setTodosDoc] = useState(() => {
    const savedDoc = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedDoc
      ? Automerge.load<{ todos: Todo[] }>(Uint8Array.from(JSON.parse(savedDoc)))
      : Automerge.from<{ todos: Todo[] }>({ todos: [] });
  });

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Save to local storage whenever todosDoc changes
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(Array.from(Automerge.save(todosDoc)))
    );
  }, [todosDoc]);

  // Monitor connection status and reconnect when online
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize WebSocket connection when online
  // And sync local changes on reconnect
  useEffect(() => {
    if (isOnline && !ws) {
      // Initialize WebSocket connection when online
      const socket = new WebSocket("ws://localhost:8080");
      setWs(socket);

      socket.onopen = () => {
        // Sync local changes on reconnect
        const changes = Automerge.getChanges(Automerge.init(), todosDoc);
        socket.send(JSON.stringify(Array.from(changes)));
      };

      socket.onmessage = (event) => {
        const remoteChanges = new Uint8Array(JSON.parse(event.data));
        setTodosDoc((doc) => Automerge.applyChanges(doc, [remoteChanges])[0]);
      };

      socket.onclose = () => setWs(null);
    }
  }, [isOnline, ws, todosDoc]);

  const addTodo = (text: string) => {
    setTodosDoc((doc) =>
      Automerge.change(doc, (draft) => {
        draft.todos.push({ id: Date.now().toString(), text, completed: false });
      })
    );

    if (ws && ws.readyState === WebSocket.OPEN) {
      const changes = Automerge.getLastLocalChange(todosDoc);
      if (changes) ws.send(JSON.stringify(Array.from(changes)));
    }
  };

  return { todos: todosDoc.todos, addTodo };
};
