const { serve } = require('@hono/node-server');
const { Hono } = require('hono');
const crypto = require('crypto');

const app = new Hono();

let todos = [];

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware for logging
app.use('*', async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
});

// Root Route
app.get('/', (c) => {
  const randomString = crypto.randomUUID();
  return c.text(`Server is Running! Random String to Check: ${randomString}`);
});

// Create a new todo
app.post('/todos', async (c) => {
  try {
    let body;
    if (c.req.header('content-type')?.includes('application/json')) {
      body = await c.req.json();
    } else {
      body = await c.req.parseBody();
    }
    const { title, status = 'todo' } = body;

    if (!title || title.length > 200) {
      return c.json({ message: 'Title is required and should be within 200 characters' }, 400);
    }

    const now = new Date().toISOString();
    const newTodo = {
      id: crypto.randomUUID(),
      title,
      status,
      createdAt: now,
      updatedAt: now,
    };

    todos.push(newTodo);

    return c.json({
      message: 'Todo created',
      todo: newTodo,
    }, 201);
  } catch (error) {
    console.error('Error in POST /todos:', error);
    return c.json({ message: 'Invalid JSON or request body', error: error.message }, 400);
  }
});

// Get all todos
app.get('/todos', (c) => {
  return c.json(todos);
});

// Get a specific todo by ID
app.get('/todos/:id', (c) => {
  const { id } = c.req.param();
  const todo = todos.find(item => item.id === id);

  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  return c.json(todo);
});

// Update a specific todo by ID
app.put('/todos/:id', async (c) => {
  try {
    let body;
    if (c.req.header('content-type')?.includes('application/json')) {
      body = await c.req.json();
    } else {
      body = await c.req.parseBody();
    }
    const { id } = c.req.param();
    const { title, status } = body;
    const todoIndex = todos.findIndex(item => item.id === id);

    if (todoIndex === -1) {
      return c.json({ message: 'Todo not found' }, 404);
    }
    if (title === '' || (title && title.length > 200)) {
      return c.json({ message: 'Title is required'},
        400);
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      title: title || todos[todoIndex].title,
      status: status || todos[todoIndex].status,
      updatedAt: new Date().toISOString(),
    };

    return c.json({
      message: 'Todo updated',
      todo: todos[todoIndex],
    });
  } catch (error) {
    console.error('Error in PUT /todos/:id:', error);
    return c.json({ message: 'Invalid JSON data', error: error.message }, 400);
  }
});

// Delete a specific todo by ID
app.delete('/todos/:id', (c) => {
  const { id } = c.req.param();
  const todoIndex = todos.findIndex(item => item.id === id);

  if (todoIndex === -1) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  const deletedTodo = todos.splice(todoIndex, 1)[0];

  return c.json({
    message: 'Todo deleted',
    todo: deletedTodo,
  });
});

// Delete all todos
app.delete('/todos', (c) => {
  todos = [];

  return c.json({
    message: 'All todos have been deleted!',
  });
});

// Catch All route for undefined routes
app.all('*', (c) => {
  const availableRoutes = [
    { method: 'GET', route: '/' },
    { method: 'POST', route: '/todos' },
    { method: 'GET', route: '/todos' },
    { method: 'GET', route: '/todos/:id' },
    { method: 'PUT', route: '/todos/:id' },
    { method: 'DELETE', route: '/todos/:id' },
    { method: 'DELETE', route: '/todos' },
  ];

  return c.json({
    message: 'Requested route not found. Here are the available routes:',
    routes: availableRoutes,
  }, 404);
});

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});