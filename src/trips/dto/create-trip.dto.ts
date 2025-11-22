export class CreateTripDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  creatorUserId?: number;
}
