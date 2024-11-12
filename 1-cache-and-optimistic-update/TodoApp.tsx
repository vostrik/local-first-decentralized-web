import React, { useState } from 'react';
import { useTodos } from './useTodos';

const TodoApp = () => {
  const { todos, addTodo } = useTodos();
  const [text, setText] = useState("");

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => { addTodo(text); setText(""); }}>Add</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.text} {todo.id === -1 && "(saving...)"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoApp;
