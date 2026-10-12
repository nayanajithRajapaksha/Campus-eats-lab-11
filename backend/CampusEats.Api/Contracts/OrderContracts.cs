using System.ComponentModel.DataAnnotations;

namespace CampusEats.Api.Contracts;

public sealed record CreateOrderItemRequest(
    [Range(1, int.MaxValue)] int MenuItemId,
    [Range(1, 20)] int Quantity);

public sealed record CreateOrderRequest(
    [Required, MinLength(1)] IReadOnlyList<CreateOrderItemRequest> Items);

public sealed record OrderItemResponse(
    int MenuItemId,
    string Name,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public sealed record OrderResponse(
    int Id,
    DateTime CreatedAtUtc,
    string Status,
    string PaymentMethod,
    decimal Total,
    IReadOnlyList<OrderItemResponse> Items);
