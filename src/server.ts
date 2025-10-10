import express from "express"
import type { Express, Request, Response, NextFunction } from "express"

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
	methods: ["GET", "POST"],
	credentials: true,
}))

function authenticate(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" })
	}

	const token = authHeader.split(" ")[1]
	if (token !== process.env.API_TOKEN) {
		return res.status(403).json({ error: "Forbidden" })
	}

	next()
}

app.use(authenticate)

app.get("/", (_req: Request, res: Response) => {
	res.send("Ticket API.")
})

app.post("/tickets", async (req: Request, res: Response) => {
	const ticketDTO: TicketCreateDTO = req.body

	if (!ticketDTO.name || !ticketDTO.email || !ticketDTO.message) {
		return res.status(400).json({ error: "Missing required ticket fields" })
	}

	const ticket: Ticket = await prisma.ticket.create({
		data: ticketDTO
	})

	const response: TicketResponseDTO = {
		message: "Printing Ticket",
		ticket: ticket
	}

	res.status(201).json(response)
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

	const tickets = await prisma.ticket.findMany({
		where,
		orderBy: { createdAt: "desc" },
	})

	if (!tickets.length) {
		return res.status(404).json({ error: "No ticket found" })
	}

	res.json(tickets)
})

app.get("/tickets/:id", async (req: Request, res: Response) => {
	const ticket: Ticket | null = await prisma.ticket.findUnique({
		where: { id: Number(req.params.id) }
	})

	if (!ticket) {
		return res.status(404).json({ error: "Ticket not found" })
	}

	res.json(ticket)
})

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
})
