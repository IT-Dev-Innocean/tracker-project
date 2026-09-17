export function buildAssistantRecommendations({ tMsg }) {
  return [
    {
      id: 'nearest-deadlines',
      icon: 'calendar',
      label: tMsg(
        'Which projects or tasks have the nearest deadlines?',
        'Project atau task dengan deadline terdekat ada apa saja?'
      ),
      prompt: tMsg(
        'Which projects or tasks have the nearest deadlines? Answer in chat with names dates status and assignees ranked closest first.',
        'Project atau task dengan deadline terdekat ada apa saja? Jawab di chat: sebutkan nama tanggal status dan PIC diurutkan dari yang paling dekat.'
      ),
    },
    {
      id: 'overload-today',
      icon: 'users',
      label: tMsg(
        'Which team or person is most overloaded today?',
        'Tim mana atau siapa yang paling overload hari ini?'
      ),
      prompt: tMsg(
        'Which team or person is most overloaded today? Answer in chat by comparing active in-progress tasks per assignee or team.',
        'Tim mana atau siapa yang paling overload hari ini? Jawab di chat dengan membandingkan tugas aktif per PIC atau tim.'
      ),
    },
    {
      id: 'task-project-count',
      icon: 'clipboard-list',
      label: tMsg(
        'How many tasks and projects are available?',
        'Berapa jumlah task dan project yang tersedia?'
      ),
      prompt: tMsg(
        'How many tasks and projects are currently available? Give the totals, then a short breakdown by status if possible.',
        'Berapa jumlah task dan project yang tersedia saat ini? Berikan totalnya, lalu ringkas per status jika memungkinkan.'
      ),
    },
  ];
}
