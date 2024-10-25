import { Hono } from "hono";
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';
import { cors } from 'hono/cors'

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    // we did this because typescript does not understand what c.env.DATABASE_URL is
    // and this is how we tell it that it is of string datatype and hence we can now successfull injects the
    // database url in the index.ts file
    JWT_SECRET: string;
  }
}>();

app.use('/*', cors())
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);

//we need file based routing for the app

export default app;

//but we also need prisma to create a connection pool to access the database
//since we are creting a serverless application so it will create multiple instances of an application around the world
//it is wrong approach when multiple mini machines connect to db it is good practice to connect to a connection pool first.
