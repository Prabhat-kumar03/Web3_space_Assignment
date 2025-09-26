import React from 'react';

const PostCard = ({ post, onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded p-4 mb-4">
      <h3 className="text-xl font-semibold">{post.title}</h3>
      <p className="text-gray-700 mt-2">{post.content}</p>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => onEdit(post)}
          className="bg-yellow-400 text-white px-4 py-1 rounded hover:bg-yellow-500"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default PostCard;
