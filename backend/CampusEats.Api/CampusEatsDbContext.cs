using Microsoft.EntityFrameworkCore;

namespace CampusEats.Api;

public class CampusEatsDbContext : DbContext
{
    public CampusEatsDbContext(DbContextOptions<CampusEatsDbContext> options)
        : base(options)
    {
    }

    public DbSet<WeatherForecast> WeatherForecasts => Set<WeatherForecast>();

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Name).IsRequired().HasMaxLength(150);
            entity.Property(item => item.Description).IsRequired().HasMaxLength(500);
            entity.Property(item => item.Price).HasPrecision(10, 2);
            entity.Property(item => item.Category).IsRequired().HasMaxLength(80);

            entity.HasData(
                new MenuItem { Id = 1, Name = "Chicken Rice", Description = "Rice with chicken curry and vegetables.", Price = 650.00m, Category = "Meals" },
                new MenuItem { Id = 2, Name = "Vegetable Rice", Description = "Rice with seasonal vegetable curries.", Price = 450.00m, Category = "Meals" },
                new MenuItem { Id = 3, Name = "Chicken Kottu", Description = "Chopped roti with chicken, vegetables and spices.", Price = 750.00m, Category = "Meals" },
                new MenuItem { Id = 4, Name = "Vegetable Kottu", Description = "Chopped roti with vegetables and spices.", Price = 550.00m, Category = "Meals" },
                new MenuItem { Id = 5, Name = "Chicken Sandwich", Description = "Chicken and fresh vegetables served in bread.", Price = 400.00m, Category = "Snacks" },
                new MenuItem { Id = 6, Name = "Vegetable Roll", Description = "A crisp roll filled with seasoned vegetables.", Price = 150.00m, Category = "Snacks" },
                new MenuItem { Id = 7, Name = "Milk Tea", Description = "Freshly brewed tea with milk.", Price = 120.00m, Category = "Drinks" },
                new MenuItem { Id = 8, Name = "Lime Juice", Description = "Fresh lime juice served chilled.", Price = 200.00m, Category = "Drinks" }
            );
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Name).IsRequired().HasMaxLength(100);
            entity.Property(user => user.Email).IsRequired().HasMaxLength(254);
            entity.Property(user => user.NormalizedEmail).IsRequired().HasMaxLength(254);
            entity.Property(user => user.PasswordHash).IsRequired().HasMaxLength(500);
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(order => order.Id);
            entity.Property(order => order.Status).IsRequired().HasMaxLength(40);
            entity.Property(order => order.PaymentMethod).IsRequired().HasMaxLength(40);
            entity.Property(order => order.Total).HasPrecision(10, 2);
            entity.HasOne(order => order.User)
                .WithMany(user => user.Orders)
                .HasForeignKey(order => order.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(item => item.Id);
            entity.Property(item => item.MenuItemName).IsRequired().HasMaxLength(150);
            entity.Property(item => item.UnitPrice).HasPrecision(10, 2);
            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.MenuItem)
                .WithMany()
                .HasForeignKey(item => item.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // The existing forecast model has no primary key and is read-only.
        modelBuilder.Entity<WeatherForecast>(entity =>
        {
            entity.HasNoKey();
            entity.Ignore(forecast => forecast.TemperatureF);
        });
    }
}
