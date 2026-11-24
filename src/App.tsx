import { useState, useEffect } from 'react'
import './App.css'

type Task = {
  id: number
  title: string
  description: string
  priority: string
  dueDate: string
  status: string
  label: string
}

type Board = {
  id: number
  name: string
  tasks: Task[]
}

const columns = ['To Do', 'In Progress', 'In Review', 'Completed']

function App() {
  const [boards, setBoards] = useState<Board[]>(() => {
    const saved = localStorage.getItem('taskflow-boards')
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'My Tasks', tasks: [] }
    ]
  })

  const [activeBoard, setActiveBoard] = useState(1)
  const [page, setPage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [darkMode, setDarkMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    label: 'Frontend',
    status: 'To Do'
  })

  useEffect(() => {
    localStorage.setItem('taskflow-boards', JSON.stringify(boards))
  }, [boards])

  const board = boards.find(b => b.id === activeBoard)!
  const tasks = board?.tasks || []

  const updateTasks = (newTasks: Task[]) => {
    setBoards(prev =>
      prev.map(b =>
        b.id === activeBoard ? { ...b, tasks: newTasks } : b
      )
    )
  }





  const saveTask = () => {
    if (!form.title.trim()) {
      alert('Please enter a task title')
      return
    }

    if (editingTask) {
      updateTasks(tasks.map(t =>
        t.id === editingTask.id ? { ...editingTask, ...form } : t
      ))
    } else {
      updateTasks([
        ...tasks,
        { id: Date.now(), ...form }
      ])
    }

    setShowModal(false)
  }

  const editTask = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      label: task.label,
      status: task.status
    })
    setShowModal(true)
  }

  const deleteTask = (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      updateTasks(tasks.filter(t => t.id !== id))
    }
  }

  const moveTask = (id: number, status: string) => {
    updateTasks(tasks.map(t =>
      t.id === id ? { ...t, status } : t
    ))
  }

  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'Completed').length
  const pending = total - completed

  const overdue = tasks.filter(t =>
    t.dueDate &&
    new Date(t.dueDate) < new Date(new Date().toDateString()) &&
    t.status !== 'Completed'
  ).length

  const completion = total ? Math.round((completed / total) * 100) : 0

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const changeMonth = (amount: number) => {
    setSelectedDate(new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + amount,
      1
    ))
  }

  const firstDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay()

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate()

  const exportData = () => {
    const data = JSON.stringify(boards, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'taskflow-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (Array.isArray(data)) {
          setBoards(data)
          setActiveBoard(data[0]?.id || 1)
        } else {
          alert('Invalid backup file')
        }
      } catch {
        alert('Could not import file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className={darkMode ? 'app dark' : 'app'}>

<aside className="sidebar">

  <h2 className="logo">TaskFlow</h2>

  <p className="menu-heading">MENU</p>

  {['Dashboard', 'Board', 'Calendar', 'Settings'].map(item => (
    <button
      key={item}
      className={page === item ? 'nav-item active' : 'nav-item'}
      onClick={() => setPage(item)}
    >
      {item === 'Dashboard' ? '⌂' :
       item === 'Board' ? '▦' :
       item === 'Calendar' ? '▣' : '⚙'}

      <span>{item}</span>
    </button>
  ))}

</aside>

      <main className="main">



        {page === 'Dashboard' && (
          <section className="content">

            

            <div className="stats-grid">
              <div className="stat-card">
                <p>Total Tasks</p>
                <h2>{total}</h2>
                <small>Across this board</small>
              </div>

              <div className="stat-card">
                <p>Completed</p>
                <h2>{completed}</h2>
                <small>Tasks finished</small>
              </div>

              <div className="stat-card">
                <p>Pending</p>
                <h2>{pending}</h2>
                <small>Tasks remaining</small>
              </div>

              <div className="stat-card">
                <p>Overdue</p>
                <h2>{overdue}</h2>
                <small>Past due date</small>
              </div>
            </div>

            <div className="dashboard-grid">

              <div className="panel progress-panel">
                <h3>Overall Progress</h3>
                <p className="muted">Your task completion rate</p>

                <div className="progress-circle">
                  <span>{completion}%</span>
                </div>

                <p className="progress-caption">
                  {completed} out of {total} tasks completed
                </p>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <h3>Recent Tasks</h3>
                  <button onClick={() => setPage('Board')}>View all →</button>
                </div>

                {tasks.slice(-5).reverse().map(task => (
                  <div className="recent-task" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.label}</small>
                    </div>
                    <span className={`priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <p className="empty">No tasks yet. Add your first task!</p>
                )}
              </div>

            </div>
          </section>
        )}

        {page === 'Board' && (
          <section className="content">
            <div className="board-top">
              <div>
                <h3>{board?.name}</h3>
                <p className="muted">{total} tasks in this board</p>
              </div>

              <input
                className="search"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="kanban">
              {columns.map(column => {
                const columnTasks = filteredTasks.filter(
                  t => t.status === column
                )

                return (
                  <div
                    className="kanban-column"
                    key={column}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      const id = Number(e.dataTransfer.getData('taskId'))
                      moveTask(id, column)
                    }}
                  >
                    <div className="column-heading">
                      <h4>{column}</h4>
                      <span>{columnTasks.length}</span>
                    </div>

                    {columnTasks.map(task => (
                      <div
                        className="task-card"
                        key={task.id}
                        draggable
                        onDragStart={e =>
                          e.dataTransfer.setData('taskId', String(task.id))
                        }
                      >
                        <div className="task-card-top">
                          <span className={`priority ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>

                          <div>
                            <button onClick={() => editTask(task)}>✎</button>
                            <button onClick={() => deleteTask(task.id)}>×</button>
                          </div>
                        </div>

                        <h4>{task.title}</h4>
                        <p>{task.description}</p>

                        <div className="task-footer">
                          <span className="task-label">{task.label}</span>
                          <small>{task.dueDate || 'No due date'}</small>
                        </div>
                      </div>
                    ))}

                    <button className="add-column-task" onClick={() => {
                      setForm({ ...form, status: column })
                      setEditingTask(null)
                      setShowModal(true)
                    }}>
                      + Add a task
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {page === 'Calendar' && (
          <section className="content">
            <div className="panel calendar-panel">

              <div className="calendar-header">
                <button onClick={() => changeMonth(-1)}>←</button>
                <h3>
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <button onClick={() => changeMonth(1)}>→</button>
              </div>

              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div className="calendar-day-name" key={day}>{day}</div>
                ))}

                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1

                  const dateString =
                    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

                  const dayTasks = tasks.filter(t => t.dueDate === dateString)

                  const isSelected =
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === new Date().getMonth() &&
                    selectedDate.getFullYear() === new Date().getFullYear()

                  return (
                    <div
                      key={day}
                      className={`calendar-date ${isSelected ? 'today' : ''} ${dayTasks.length ? 'has-tasks' : ''}`}
                      onClick={() => setSelectedDate(new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        day
                      ))}
                    >
                      <span>{day}</span>

                      {dayTasks.length > 0 && (
                        <div className="calendar-dots">
                          {dayTasks.slice(0, 3).map(t => (
                            <span key={t.id} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="selected-tasks">
                <h3>
                  Tasks for {selectedDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>

                {tasks.filter(t => {
                  const d = new Date(t.dueDate + 'T00:00:00')
                  return t.dueDate &&
                    d.getDate() === selectedDate.getDate() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getFullYear() === selectedDate.getFullYear()
                }).map(task => (
                  <div className="recent-task" key={task.id}>
                    <strong>{task.title}</strong>
                    <span className={`priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <button onClick={() => editTask(task)}>Edit</button>
                  </div>
                ))}

                {!tasks.some(t => {
                  const d = new Date(t.dueDate + 'T00:00:00')
                  return t.dueDate &&
                    d.getDate() === selectedDate.getDate() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getFullYear() === selectedDate.getFullYear()
                }) && <p className="empty">No tasks scheduled for this day.</p>}
              </div>
            </div>
          </section>
        )}

        {page === 'Settings' && (
          <section className="content">
            <div className="panel settings-panel">
              <h3>Appearance</h3>
              <p className="muted">Change how TaskFlow looks.</p>

              <div className="setting-row">
                <div>
                  <strong>Dark Mode</strong>
                  <p>Switch between light and dark themes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={e => setDarkMode(e.target.checked)}
                />
              </div>

              <hr />

              <h3>Data Management</h3>
              <p className="muted">Manage your boards and tasks.</p>

              <div className="setting-row">
                <div>
                  <strong>Export Data</strong>
                  <p>Download all your boards as a JSON file.</p>
                </div>
                <button className="secondary-button" onClick={exportData}>
                  Export
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Import Data</strong>
                  <p>Restore boards from a backup file.</p>
                </div>
                <label className="secondary-button">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={importData}
                  />
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Clear Data</strong>
                  <p>Delete all saved boards and tasks.</p>
                </div>
                <button
                  className="danger-button"
                  onClick={() => {
                    if (confirm('Delete all application data?')) {
                      setBoards([{ id: 1, name: 'My Tasks', tasks: [] }])
                      setActiveBoard(1)
                    }
                  }}
                >
                  Clear Data
                </button>
              </div>
            </div>
          </section>
        )}

      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-heading">
              <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <label>Task Title</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Enter task title"
            />

            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Enter description"
            />

            <div className="form-row">
              <div>
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div>
                <label>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <label>Label</label>
            <select
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
            >
              <option>Frontend</option>
              <option>Backend</option>
              <option>Design</option>
              <option>Documentation</option>
              <option>Bug</option>
            </select>

            <label>Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              {columns.map(c => <option key={c}>{c}</option>)}
            </select>

            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="add-button" onClick={saveTask}>
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App