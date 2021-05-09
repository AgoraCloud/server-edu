/**
 * Payload of the wiki.section.deleted event
 */
export class WikiSectionDeletedEvent {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
