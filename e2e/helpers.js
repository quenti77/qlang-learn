// The code of a block is in a CodeMirror editor: read and set it through the editor itself.
export const getCode = (editor) => editor.evaluate((el) => el.qlangEditor.value);
export const setCode = (editor, text) => editor.evaluate((el, value) => (el.qlangEditor.value = value), text);
