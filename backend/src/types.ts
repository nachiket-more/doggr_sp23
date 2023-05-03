export type ICreateUsersBody = {
	name: string,
	email: string,
	petType: string
}


export type ICreateMessageBody = {
	sender: string,
	receiver: string,
	message: string,
	deleted_at: Date
}