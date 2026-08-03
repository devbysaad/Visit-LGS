import { ItemType } from '../../../types/Items'

/**
 * Common shape shared by anything the PlayerSelector can pick up: chairs/vending
 * machines (Item.ts, sprite-based) as well as BuildingZone/NpcZone (Zone-based,
 * no visible sprite). MyPlayer only needs this much to decide what E should do.
 */
export default interface Interactable {
  itemType: ItemType
  depth: number
  clearDialogBox(): void
  onOverlapDialog(): void
}
