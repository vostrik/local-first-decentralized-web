import { useState, useEffect } from 'react';
import * as Automerge from 'automerge';
import initSqlJs from 'sql.js';

type Todo = { id: string; text: string; completed: boolean };

export const useTodosAutomerge = () => {
  const [todosDoc, setTodosDoc] = useState(() => Automerge.from<{ todos: Todo[] }>({ todos: [] }));
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [db, setDb] = useState<any>(null);

  // init db
  useEffect(() => {
    const initializeDb = async () => {
      const SQL = await initSqlJs({ locateFile: (file) => `https://sql.js.org/dist/${file}` });
      const db = new SQL.Database();
      db.run("CREATE TABLE IF NOT EXISTS todos (id TEXT, text TEXT, completed INTEGER)");
      setDb(db);

      // Load existing todos from IndexedDB
      const savedData = await loadFromIndexedDB("todos-automerge-db");
      if (savedData) db.run(savedData);

      // Load todos into Automerge from the database
      const todos = db.exec("SELECT * FROM todos")[0]?.values || [];
      setTodosDoc((doc) =>
        Automerge.change(doc, (draft) => {
          draft.todos = todos.map(([id, text, completed]: [string, string, number]) => ({
            id,
            text,
            completed: !!completed,
          }));
        })
      );
    };

    initializeDb();
  }, []);

  // Monitor connection status and reconnect when online
  useEffect(() => {
    // Monitor connection status and reconnect when online
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
  useEffect(() => {
    if (isOnline && !ws) {
      // Initialize WebSocket connection when online
      const socket = new WebSocket("ws://localhost:8080");
      setWs(socket);

      socket.onopen = () => {
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
        const newTodo = { id: Date.now().toString(), text, completed: false };
        draft.todos.push(newTodo);

        // Add to SQLite database
        db.run("INSERT INTO todos (id, text, completed) VALUES (?, ?, ?)", [
          newTodo.id,
          newTodo.text,
          newTodo.completed ? 1 : 0,
        ]);

        // Save to IndexedDB
        saveToIndexedDB("todos-automerge-db", db.export());
      })
    );

    if (ws && ws.readyState === WebSocket.OPEN) {
      const changes = Automerge.getLastLocalChange(todosDoc);
      if (changes) ws.send(JSON.stringify(Array.from(changes)));
    }
  };

  return { todos: todosDoc.todos, addTodo };
};

// Utility functions for IndexedDB storage
// Why we need Indexed DB?
// To persist DB state between sessions
const saveToIndexedDB = (key: string, data: Uint8Array) => {
  const request = indexedDB.open(key, 1);
  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(key, "readwrite");
    const store = transaction.objectStore(key);
    store.put(data, "todos");
  };
};

const loadFromIndexedDB = (key: string): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(key, 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(key, "readonly");
      const store = transaction.objectStore(key);
      const dataRequest = store.get("todos");
      dataRequest.onsuccess = () => resolve(dataRequest.result ? new Uint8Array(dataRequest.result) : null);
    };
    request.onerror = () => resolve(null);
  });
};
