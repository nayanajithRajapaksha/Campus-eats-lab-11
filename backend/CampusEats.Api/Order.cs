namespace CampusEats.Api;

public class Order
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; }

    public string Status { get; set; } = "Confirmed";

    public string PaymentMethod { get; set; } = "Pay on pickup";

    public decimal Total { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
