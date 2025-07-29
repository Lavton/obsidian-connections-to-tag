import type { Entity } from "./entity"

export interface Rule {
	entities: Array<Entity>
	needToGo(entity: Entity): boolean 
}
