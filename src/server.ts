import express from "express"
import type { Express, Request, Response } from "express"

import dotenv from "dotenv"
import cors from "cors"

import { PrismaClient, Prisma } from "@prisma/client"
import type { Ticket } from "@prisma/client"

import type { TicketQueryParams, TicketCreateDTO, TicketResponseDTO } from "./types/ticket.ts"

dotenv.config()

const prisma = new PrismaClient()
const app: Express = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT || 3000

const allowedOrigins = [
	"https://adolfogante.com",
	"https://www.adolfogante.com"
]

app.use(cors({
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true,
}))

app.use("/tickets", (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" })
	}

	const token = authHeader.split(" ")[1];
	if (token !== process.env.API_TOKEN) {
		return res.status(403).json({ error: "Forbidden" })
	}

	next()
})

app.get("/", (req: Request, res: Response) => {
	res.send("Ticket API.")
})

app.post("/submit", async (req: Request, res: Response) => {
	const ticketDTO: TicketCreateDTO = req.body

	const ticket: Ticket = await prisma.ticket.create({
		data: ticketDTO
	})

	const response: TicketResponseDTO = {
		message: "Printing Ticket",
		ticket: ticket
	}

	res.json(response)
})

app.get("/tickets/id/:id", async (req: Request, res: Response) => {
	const ticket: Ticket | null = await prisma.ticket.findUnique({
		where: { id: Number(req.params.id) }
	})

	res.json(ticket)
})

app.get("/tickets", async (req, res) => {
	const { name, email } = req.query as TicketQueryParams

	const where: Prisma.TicketWhereInput = {}

	if (typeof name === "string" && name.trim() !== "") {
		where.name = { contains: name, mode: "insensitive" }
	}

	if (typeof email === "string" && email.trim() !== "") {
		where.email = { contains: email, mode: "insensitive" }
	}

	console.log("Prisma where filter:", where)

	const tickets = await prisma.ticket.findMany({
		where,
		orderBy: { createdAt: "desc" },
	});

	res.json(tickets)
});
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
})
