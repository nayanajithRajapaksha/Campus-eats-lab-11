using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusEats.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/menu")]
public class MenuController : ControllerBase
{
    private readonly CampusEatsDbContext _context;

    public MenuController(CampusEatsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<MenuItem>>> Get(CancellationToken cancellationToken)
    {
        var items = await _context.MenuItems
            .AsNoTracking()
            .OrderBy(item => item.Id)
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MenuItem>> GetById(int id, CancellationToken cancellationToken)
    {
        var item = await _context.MenuItems
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);

        return item is null ? NotFound() : Ok(item);
    }
}
