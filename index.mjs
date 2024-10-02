import { Hono } from "hono";
import { serve } from '@hono/node-server'

const app = new Hono();
const todos = [];

// READ TODO
app.get("/", (c) => {
  return c.json(todos);
});

// CREATE TODO
app.post("/", async (c) => {
  try {
    const todoData = await c.req.json();

    if (!todoData.text) {
      return c.json({ message: "Todo text is required" }, 400);
    }

    const existingTodo = todos.find((x) => x.text === todoData.text);

    if (existingTodo) {
      return c.json({ message: "Todo already exists" }, 409);
    }

    const myTodo = {
      id: todos.length,
      text: todoData.text,
      date: new Date(),
    };
    todos.push(myTodo);

    return c.json({ message: "Successfully created todo", todo: myTodo }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Failed to create todo" }, 500);
  }
});

// UPDATE TODO
app.put("/:id", async (c) => {
  try {
    const todoData = await c.req.json();
    const id = c.req.param("id");

    if (!todoData.text) {
      return c.json({ message: "Todo text is required" }, 400);
    }

    const findTodoId = todos.findIndex((t) => t.id === parseInt(id));

    if (findTodoId === -1) {
      return c.json({ message: "Todo not found" }, 404);
    }

    todos[findTodoId] = {
      ...todos[findTodoId],
      text: todoData.text,
      date: new Date(),
    };

    return c.json({ message: "Todo updated", todo: todos[findTodoId] });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Failed to update todo" }, 500);
  }
});

// DELETE TODO
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const findTodoId = todos.findIndex((t) => t.id === parseInt(id));

    if (findTodoId === -1) {
      return c.json({ message: "Todo not found" }, 404);
    }

    const deletedTodo = todos.splice(findTodoId, 1)[0];

    return c.json({ message: "Todo successfully deleted", todo: deletedTodo });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Server error" }, 500);
  }
});

const port = 3000;
console.log(`Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});