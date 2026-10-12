using System.Security.Claims;
using CampusEats.Api.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusEats.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private const int MaximumItemsPerLine = 20;
    private const int MaximumItemsPerOrder = 50;
    private readonly CampusEatsDbContext _context;

    public OrdersController(CampusEatsDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var quantities = new Dictionary<int, int>();
        foreach (var item in request.Items)
        {
            if (item.MenuItemId <= 0 || item.Quantity is < 1 or > MaximumItemsPerLine)
            {
                return InvalidOrder("Each item must have a valid menu item ID and a quantity from 1 to 20.");
            }

            quantities[item.MenuItemId] = quantities.GetValueOrDefault(item.MenuItemId) + item.Quantity;
            if (quantities[item.MenuItemId] > MaximumItemsPerLine)
            {
                return InvalidOrder("The combined quantity for a menu item cannot exceed 20.");
            }
        }

        if (quantities.Values.Sum() > MaximumItemsPerOrder)
        {
            return InvalidOrder("An order cannot contain more than 50 items.");
        }

        var menuItemIds = quantities.Keys.ToArray();
        var menuItems = await _context.MenuItems
            .AsNoTracking()
            .Where(item => menuItemIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, cancellationToken);

        var missingIds = menuItemIds.Except(menuItems.Keys).OrderBy(id => id).ToArray();
        if (missingIds.Length > 0)
        {
            return InvalidOrder($"Menu item IDs {string.Join(", ", missingIds)} do not exist.");
        }

        var order = new Order
        {
            UserId = userId,
            CreatedAtUtc = DateTime.UtcNow,
            Status = "Confirmed",
            PaymentMethod = "Pay on pickup"
        };

        foreach (var (menuItemId, quantity) in quantities.OrderBy(entry => entry.Key))
        {
            var menuItem = menuItems[menuItemId];
            order.Items.Add(new OrderItem
            {
                MenuItemId = menuItem.Id,
                MenuItemName = menuItem.Name,
                UnitPrice = menuItem.Price,
                Quantity = quantity
            });
        }

        order.Total = order.Items.Sum(item => item.UnitPrice * item.Quantity);
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ToResponse(order));
    }

    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var orders = await _context.Orders
            .AsNoTracking()
            .Where(order => order.UserId == userId)
            .Include(order => order.Items)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ThenByDescending(order => order.Id)
            .ToListAsync(cancellationToken);

        return Ok(orders.Select(ToResponse).ToArray());
    }

    private BadRequestObjectResult InvalidOrder(string detail) => BadRequest(new ProblemDetails
    {
        Title = "Invalid order",
        Detail = detail,
        Status = StatusCodes.Status400BadRequest
    });

    private bool TryGetUserId(out int userId) =>
        int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"),
            out userId);

    private static OrderResponse ToResponse(Order order) => new(
        order.Id,
        order.CreatedAtUtc,
        order.Status,
        order.PaymentMethod,
        order.Total,
        order.Items
            .OrderBy(item => item.Id)
            .Select(item => new OrderItemResponse(
                item.MenuItemId,
                item.MenuItemName,
                item.UnitPrice,
                item.Quantity,
                item.UnitPrice * item.Quantity))
            .ToArray());
}
