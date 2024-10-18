import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    // we did this because typescript does not understand what c.env.DATABASE_URL is
    // and this is how we tell it that it is of string datatype and hence we can now successfull injects the
    // database url in the index.ts file
    JWT_SECRET: string;
  };
}>();

//we need file based routing for the app

// SIGNUP Route

app.post("/api/v1/user/signup", async (c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL, // the env variable is not accessible globally it must happen in each and every route
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
        name: body.name,
      },
    });
    const jwt = await sign(
      {
        id: user.id,
      },
      c.env.JWT_SECRET
    );

    return c.text(jwt);
  } catch (e) {
    console.log(e);
    c.status(403);
    return c.text('Invalid');
  }
})

// SIGNIN Route

app.post("/api/v1/user/signin", async (c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL, // the env variable is not accessible globally it must happen in each and every route
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password,
        name: body.name,
      },
    });
    if (!user) {
      // if user dosent exist
      c.status(403); // ststus code for unauthorized
      return c.text("Invalid");
    }
    const jwt = await sign(
      {
        id: user.id,
      },
      c.env.JWT_SECRET
    );

    return c.text(jwt);
  } catch (e) {
    console.log(e);
    c.status(411);
    return c.text('Invalid');
  }
})

app.post("/api/v1/blog", (c) => {
  return c.text("Hello Hono!");
});

app.put("/api/v1/user/blog", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/v1/user/blog", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/v1/user/blog/blog", (c) => {
  return c.text("Hello Hono!");
});

export default app;

//but we also need prisma to create a connection pool to access the database
//since we are creting a serverless application so it will create multiple instances of an application around the world
//it is wrong approach when multiple mini machines connect to db it is good practice to connect to a connection pool first.
