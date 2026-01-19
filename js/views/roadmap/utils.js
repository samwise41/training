// js/views/roadmap/utils.js

export const safeMarked = (content) => {
    return window.marked ? window.marked.parse(content) : content;
};
