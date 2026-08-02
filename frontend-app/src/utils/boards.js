/** Personal auto-provisioned To-do List boards — keep out of project lists. */
export function isTodoListBoard(board) {
  if (!board) return false;
  const name = String(board.name || '')
    .trim()
    .toLowerCase();
  const isPrivate = board.is_private === 1 || board.is_private === true;
  return isPrivate && name === 'to-do list';
}

export function excludeTodoListBoards(boards = []) {
  return boards.filter((b) => !isTodoListBoard(b));
}
