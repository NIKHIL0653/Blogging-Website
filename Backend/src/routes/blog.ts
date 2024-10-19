// import { Hono } from "hono";
// import { PrismaClient } from "@prisma/client/edge";
// import { withAccelerate } from "@prisma/extension-accelerate";
// import { verify } from 'hono/jwt';

// export const blogRouter = new Hono<{
//     Bindings: {
//       DATABASE_URL: string,
//       JWT_SECRET: string
//     },
//     Variables: {
//       jwtPayload: string
//     }
//   }>();

// //middleware is the place where we take 
// // the token from the user and extract the userId and pass it from middleware to the route handler

// blogRouter.use('/*', async (c, next) => { 
//       const authHeader = c.req.header('Authorization') || "";
//       const user = await verify(authHeader, c.env.JWT_SECRET);
//       if (user) {
//         c.set("jwtPayload", user.id);
//         await next();
//       } else {
//       // console.error(error);
//       c.status(403);
//       return c.json({ 
//         message: 'UnAuthorized' 
//     });
//     }
//   });

// // all these routes need to be authenticated so we need to write a middleware
// blogRouter.post('/', async (c) => {
//     const body = await c.req.json();
//     const authorId = c.get("jwtPayload");
//     const prisma = new PrismaClient({
//       datasourceUrl: c.env.DATABASE_URL, // the env variable is not accessible globally it must happen in each and every route
//     }).$extends(withAccelerate())

//     const blog = await prisma.blog.create({
//         data:{
//             title: body.title,
//             content: body.content,
//             authorId: Number(authorId)
//         }
//     })

//     return c.json({
//         id: blog.id
//     })
//   })
  
//   blogRouter.put('/', async (c) => {
//     const body = await c.req.json();
//     const prisma = new PrismaClient({
//       datasourceUrl: c.env.DATABASE_URL, // the env variable is not accessible globally it must happen in each and every route
//     }).$extends(withAccelerate());

//     const blog = await prisma.blog.update({
//         where: { id: body.id },
//         data: {
//             title: body.title,
//             content: body.content,
//             authorId: 1
//         }
//     })

//     return c.json({
//         id: blog.id
//     })
//   })
  
//   blogRouter.get('/:id', async (c) => {
//     const id = await c.req.json();
//     const prisma = new PrismaClient({
//       datasourceUrl: c.env.DATABASE_URL, // the env variable is not accessible globally it must happen in each and every route
//     }).$extends(withAccelerate())

//     try{
//         const blog = await prisma.blog.findFirst({
//             where: {
//                 id: Number(id)
//             },
//         })
    
//         return c.json({
//             blog
//         });

//     }catch(e){
//         c.status(411);
//         return c.json({ 
//             message: "Error while fetching blog post" 
//         });
//     }
// })
    
//   //this router will return all the available blogs/headings of the blogs
//   // dont need to show all the blogs but give the user an option to ask for more
//   blogRouter.get('/bulk', async(c) => {
//     const prisma = new PrismaClient({
//         datasourceUrl: c.env.DATABASE_URL,
//     }).$extends(withAccelerate())
//     const blogs = await prisma.blog.findMany();

//     return c.json({
//         blogs
//     })
//   });

import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";

// Ts can't read toml files so it doesn't know the type of the DATABASE_URL
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    jwtPayload: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  try {
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if (user) {
      c.set("jwtPayload", user.id);
      await next();
    } else {
      c.status(403);
      return c.json({ message: "You are not logged in" });
    }
  } catch (error) {
    c.status(401);
    return c.json({ message: "You are not logged in" });
  }
});

blogRouter.post("/", async (c) => {
  const body = await c.req.json();

  const {success} = createBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({message: "Inputs not correct"});
  }
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(authorId),
    },
  });

  return c.json({
    id: blog.id,
  });
});

blogRouter.put("/", async (c) => {
  const body = await c.req.json();

  const {success} = updateBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({message: "Inputs not correct"});
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.update({
    where: {
      id: Number(body.id),
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.json({
    id: blog.id,
  });
});

//   Todo: Pagination
blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.blog.findMany();

  return c.json({
    blogs,
  });
});

blogRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        id: Number(id),
      },
    });

    return c.json({
      blog,
    });
  } catch (error) {
    console.log(error);
    c.status(411); // 4
    return c.json({ message: "Error while fetching blog post" });
  }
});