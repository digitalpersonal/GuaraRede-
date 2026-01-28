import React from 'react';

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const linkRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;

  const processedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(linkRegex, (match) => {
      const url = match.startsWith('www.') ? `http://${match}` : match;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${match}</a>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');

  return <p className="text-gray-600 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

export default MarkdownRenderer;