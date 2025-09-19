"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-[#2e026d] to-[#15162c] rounded-lg p-6 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
        <p className="text-white/90 mb-6 leading-relaxed text-center">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-white bg-white/10 rounded-full hover:bg-white/20 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-white bg-red-600 rounded-full hover:bg-red-700 transition font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function TodoList() {
  const [todos] = api.todo.getAll.useSuspenseQuery();
  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; todoId: string; todoTitle: string }>({
    isOpen: false,
    todoId: "",
    todoTitle: "",
  });

  const createTodo = api.todo.create.useMutation({
    onSuccess: async () => {
      await utils.todo.invalidate();
      setTitle("");
    },
  });

  const toggleTodo = api.todo.toggle.useMutation({
    onSuccess: async () => {
      await utils.todo.invalidate();
    },
  });

  const updateTodo = api.todo.update.useMutation({
    onSuccess: async () => {
      await utils.todo.invalidate();
      setEditingId(null);
      setEditTitle("");
    },
  });

  const deleteTodo = api.todo.delete.useMutation({
    onSuccess: async () => {
      await utils.todo.invalidate();
      setDeleteConfirm({ isOpen: false, todoId: "", todoTitle: "" });
    },
  });

  const handleDeleteClick = (todo: Todo) => {
    setDeleteConfirm({
      isOpen: true,
      todoId: todo.id,
      todoTitle: todo.title,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.todoId) {
      deleteTodo.mutate({ id: deleteConfirm.todoId });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, todoId: "", todoTitle: "" });
  };

  const handleEditClick = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateTodo.mutate({ id: editingId, title: editTitle.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="w-full max-w-2xl">
      {/* Header with stats */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">My Todo List</h2>
        <p className="text-white/70">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      {/* Add new todo form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) {
            createTodo.mutate({ title: title.trim() });
          }
        }}
        className="mb-6 flex gap-2"
      >
        <input
          type="text"
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          disabled={createTodo.isPending || !title.trim()}
        >
          {createTodo.isPending ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Todo list */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="rounded-lg bg-white/5 p-8 text-center">
            <p className="text-white/70">No tasks yet. Add one above to get started!</p>
          </div>
        ) : (
          todos.map((todo: Todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 rounded-lg bg-white/10 p-4 transition hover:bg-white/20 ${
                todo.completed ? "opacity-60" : ""
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo.mutate({ id: todo.id })}
                className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                  todo.completed
                    ? "bg-green-600 border-green-600"
                    : "border-white/30 hover:border-white/50"
                }`}
                disabled={toggleTodo.isPending}
              >
                {todo.completed && (
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Todo text or edit input */}
              {editingId === todo.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="flex-1 rounded bg-white/20 px-2 py-1 text-white placeholder-white/50 focus:bg-white/30 focus:outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className={`flex-1 text-white ${
                    todo.completed ? "line-through text-white/50" : ""
                  }`}
                >
                  {todo.title}
                </span>
              )}

              {/* Created date */}
              <span className="text-xs text-white/40">
                {new Date(todo.createdAt).toLocaleDateString()}
              </span>

              {/* Action buttons */}
              {editingId === todo.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveEdit}
                    className="rounded p-1 text-green-400 transition hover:bg-green-500/20 hover:text-green-300"
                    disabled={updateTodo.isPending}
                    title="Save changes"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded p-1 text-gray-400 transition hover:bg-gray-500/20 hover:text-gray-300"
                    title="Cancel editing"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditClick(todo)}
                    className="rounded p-1 text-blue-400 transition hover:bg-blue-500/20 hover:text-blue-300"
                    title="Edit task"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(todo)}
                    className="rounded p-1 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                    disabled={deleteTodo.isPending}
                    title="Delete task"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-white/70">
            <span>Progress</span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm.todoTitle}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
