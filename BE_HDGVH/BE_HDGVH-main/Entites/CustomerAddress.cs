namespace BE_API.Entities;

public class CustomerAddress : IEntity
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string ReceiverName { get; set; } = null!;
    public string ReceiverPhone { get; set; } = null!;
    public string AddressLine { get; set; } = null!;
    public bool IsDefault { get; set; }

    public Customer Customer { get; set; } = null!;
    public ICollection<CustomerOrder> OrdersShippedTo { get; set; } = new List<CustomerOrder>();
}
