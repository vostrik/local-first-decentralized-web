/**
 * 
 *  NO CHANGES NEEDED
 * 
 */
import React, { useState } from 'react';
import { useTodosAutomerge } from './useTodosAutomerge';

const TodoApp = () => {
  const { todos, addTodo, toggleTodo } = useTodosAutomerge();
  const [text, setText] = useState("");

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => { addTodo(text); setText(""); }}>Add</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.text} {todo.completed ? "(completed)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoApp;
