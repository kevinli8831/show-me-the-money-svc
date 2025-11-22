export class CreatePaymentDto {
  tripId: number;
  fromUserId: number;
  toUserId: number;
  amount: string;
  currency?: string;
  note?: string;
}
