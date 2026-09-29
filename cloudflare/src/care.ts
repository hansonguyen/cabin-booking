type RecordValue = Record<string, unknown>
const isObject = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown, max: number) => typeof value === 'string' && value.length <= max
const oneOf = (value: unknown, choices: readonly string[]) => typeof value === 'string' && choices.includes(value)

const categories = ['Chores', 'Repairs & renovations', 'Bring up', 'Running low']
const topics = ['General', 'Arrival & departure', 'Kitchen & supplies', 'Maintenance', 'Outdoors']

export function validCare(value: unknown): value is RecordValue & { tasks: RecordValue[]; articles: RecordValue[] } {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.tasks) || !Array.isArray(value.articles)) return false
  if (value.tasks.length > 500 || value.articles.length > 500) return false
  const taskIds = new Set<string>()
  for (const task of value.tasks) {
    if (!isObject(task) || !text(task.id, 100) || !task.id || taskIds.has(task.id as string) ||
      !text(task.title, 100) || !(task.title as string).trim() || !oneOf(task.category, categories) ||
      !text(task.notes, 4000) || !text(task.assignee, 254) ||
      !oneOf(task.status, ['To do', 'In progress', 'Done']) || !oneOf(task.priority, ['Normal', 'High'])) return false
    taskIds.add(task.id as string)
  }
  const articleIds = new Set<string>()
  for (const article of value.articles) {
    if (!isObject(article) || !text(article.id, 100) || !article.id || articleIds.has(article.id as string) ||
      !text(article.title, 100) || !(article.title as string).trim() || !oneOf(article.topic, topics) ||
      !text(article.problem, 8000) || !text(article.solution, 12000) || !(article.solution as string).trim() ||
      !text(article.tags, 300) || !text(article.author, 254) || !text(article.updatedAt, 40) ||
      Number.isNaN(Date.parse(article.updatedAt as string)) || typeof article.verified !== 'boolean') return false
    articleIds.add(article.id as string)
  }
  return true
}
