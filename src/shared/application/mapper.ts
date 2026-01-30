/**
 * Base Mapper interface for converting between domain entities and DTOs/Persistence models
 */
export interface Mapper<Domain, DTO, Persistence = any> {
  toDomain(raw: Persistence): Domain;
  toDTO(domain: Domain): DTO;
  toPersistence?(domain: Domain): Persistence;
}
