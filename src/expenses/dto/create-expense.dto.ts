export class CreateExpenseDto {
  tripId: number;
  title: string;
  amount: string;
  currency?: string;
  category?: string;
  note?: string;
  receiptImageUrl?: string;
  createdBy: number;
}
