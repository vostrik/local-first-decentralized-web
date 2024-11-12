import { useState } from 'react';

type Todo = { id: number; text: string };
export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [cache, setCache] = useState<Todo[]>([]);

  const addTodo = async (text: string) => {
    const tempTodo = { id: -1, text };
    setCache(todos);
    setTodos([...todos, tempTodo]);

    try {
      const savedTodo = await new Promise<Todo>((resolve) =>
        setTimeout(() => resolve({ ...tempTodo, id: Date.now() }), 500)
      );
      setTodos((prev) => prev.map((t) => (t.id === -1 ? savedTodo : t)));
    } catch {
      setTodos(cache);
    }
  };

  return { todos, addTodo };
};
