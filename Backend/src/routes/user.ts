import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { signupInput } from "../zod";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

// SIGNUP Route

userRouter.post("/signup", async (c) => {
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
    return c.text("Invalid");
  }
});

// SIGNIN Route

userRouter.post("/signin", async (c) => {
  const body = await c.req.json();

  const {success} = signupInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({message: "Inputs not correct"});
    }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL, // the env variable is not accessible globally it must happen in each and every route
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password,
      },
    });
    if (!user) {
      // if user dosent exist
      c.status(403); // ststus code for unauthorized
      return c.json({
        messgae: "Incorrect creds",
      });
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
    return c.text("Invalid");
  }
});
