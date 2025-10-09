import type { Ticket } from "@prisma/client";

export type TicketCreateDTO = {
	name: string
	email: string
	message: string
}

export type TicketResponseDTO = {
	message: string;
	ticket: Ticket;
}

export type TicketQueryParams = {
	name?: string
	email?: string
}
