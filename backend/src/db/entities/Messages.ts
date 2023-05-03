import { Entity, Property, PrimaryKey, Unique, OneToMany, Collection, Cascade } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";


@Entity({ tableName: "messages"})
export class Message {	
	@PrimaryKey()
	messageId!: number;
	
	@Property()
	sender!: string;
	
	@Property()
	receiver!: string;
	
	@Property()
	message!: string;
	
	@Property({ type: 'datetime', nullable: true })
  	deleted_at?: Date = null;

}
