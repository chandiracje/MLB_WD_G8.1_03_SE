package com.lankafresh.supermarket.config;

import com.lankafresh.supermarket.entity.*;
import com.lankafresh.supermarket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final PromotionRepository promotionRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            initUsers();
        }
        initCategoriesAndProducts();
        if (supplierRepository.count() == 0) {
            initSuppliers();
        }
        if (promotionRepository.count() == 0) {
            initPromotions();
        }
    }

    private void initUsers() {
        String encodedPassword = passwordEncoder.encode("password123");

        List<User> initialUsers = Arrays.asList(
                User.builder().name("Nadeesha Perera").email("manager@lankafresh.com").password(encodedPassword).phone("0771234567").address("123 Main Street, Colombo 03").role(UserRole.MANAGER).build(),
                User.builder().name("Ruwan Kumara").email("inventory@lankafresh.com").password(encodedPassword).phone("0719876543").address("Branch Warehouse, Colombo").role(UserRole.INVENTORY_STAFF).build(),
                User.builder().name("Tharindu Silva").email("delivery@lankafresh.com").password(encodedPassword).phone("0765554321").address("Logistics Hub, Colombo").role(UserRole.DELIVERY_STAFF).build(),
                User.builder().name("Dilini Fernando").email("support@lankafresh.com").password(encodedPassword).phone("0752223344").address("Help Desk Office").role(UserRole.SUPPORT_STAFF).build(),
                User.builder().name("Kasun Jayasinghe").email("finance@lankafresh.com").password(encodedPassword).phone("0724445566").address("Finance Division").role(UserRole.FINANCE_OFFICER).build(),
                User.builder().name("Sahan Silva").email("customer@gmail.com").password(encodedPassword).phone("0781112233").address("45/2 Galle Road, Mount Lavinia").role(UserRole.CUSTOMER).build()
        );

        for (User u : initialUsers) {
            User saved = userRepository.save(u);
            if (saved.getRole() == UserRole.CUSTOMER) {
                cartRepository.save(Cart.builder().user(saved).build());
            }
        }
    }

    private Category getOrCreateCategory(String name) {
        return categoryRepository.findByName(name)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).build()));
    }

    private void initCategoriesAndProducts() {
        Category produce = getOrCreateCategory("Fresh Produce");
        Category dairy = getOrCreateCategory("Dairy & Eggs");
        Category beverages = getOrCreateCategory("Beverages");
        Category bakery = getOrCreateCategory("Bakery & Snacks");
        Category meat = getOrCreateCategory("Meat & Seafood");
        Category pantry = getOrCreateCategory("Pantry & Staples");

        List<Product> sampleProducts = Arrays.asList(
                // 1-10 Original Products
                Product.builder().name("Organic Fresh Bananas").description("Farm-fresh sweet Cavendish bananas, rich in potassium and energy.").price(new BigDecimal("350.00")).unit("kg").stockQuantity(50).reorderLevel(15).category(produce).imageUrl("https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Red Apples").description("Crisp and juicy Royal Gala apples imported directly from orchards.").price(new BigDecimal("780.00")).unit("kg").stockQuantity(30).reorderLevel(10).category(produce).imageUrl("https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Highland Fresh Pasteurized Milk").description("1L pure whole dairy milk rich in calcium and vitamin D.").price(new BigDecimal("480.00")).unit("1L Bottle").stockQuantity(40).reorderLevel(12).category(dairy).imageUrl("https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Kotmale Cheddar Cheese 200g").description("Premium aged natural cheddar cheese block with rich creamy texture.").price(new BigDecimal("890.00")).unit("Pack").stockQuantity(25).reorderLevel(8).category(dairy).imageUrl("https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Farm Fresh Brown Eggs (Pack of 10)").description("Grade A farm fresh cage-free eggs with guaranteed quality.").price(new BigDecimal("560.00")).unit("Pack").stockQuantity(35).reorderLevel(10).category(dairy).imageUrl("https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Ceylon Pure Pure Green Tea 100g").description("Hand-picked premium loose-leaf Ceylon green tea with natural antioxidants.").price(new BigDecimal("650.00")).unit("Box").stockQuantity(45).reorderLevel(15).category(beverages).imageUrl("https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Orange Juice 1L").description("100% natural cold pressed orange juice with no added sugar.").price(new BigDecimal("720.00")).unit("Bottle").stockQuantity(8).reorderLevel(10).category(beverages).imageUrl("https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Artisan Sourdough Bread 450g").description("Naturally fermented crusty artisan sourdough bread baked fresh daily.").price(new BigDecimal("420.00")).unit("Loaf").stockQuantity(18).reorderLevel(5).category(bakery).imageUrl("https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Chicken Breast Boneless 500g").description("Tender and skinless fresh chicken breast cuts, antibiotic free.").price(new BigDecimal("1150.00")).unit("500g Pack").stockQuantity(20).reorderLevel(6).category(meat).imageUrl("https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Premium Basmati Rice 5kg").description("Long-grain fragrant aged royal basmati rice for festive meals.").price(new BigDecimal("2350.00")).unit("5kg Bag").stockQuantity(60).reorderLevel(20).category(pantry).imageUrl("https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),

                // 11-14 Additional Fresh Produce
                Product.builder().name("Nuwara Eliya Fresh Carrots 500g").description("Crisp, sweet, farm-fresh orange carrots grown in the cool climate of Nuwara Eliya.").price(new BigDecimal("240.00")).unit("500g Pack").stockQuantity(45).reorderLevel(12).category(produce).imageUrl("https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Farm Fresh Ripe Tomatoes 500g").description("Juicy, vine-ripened red tomatoes ideal for salads, curries, and sauces.").price(new BigDecimal("190.00")).unit("500g Pack").stockQuantity(60).reorderLevel(15).category(produce).imageUrl("https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Creamy Hass Avocados (Pack of 2)").description("Rich and buttery ripe avocados, packed with healthy fats and essential nutrients.").price(new BigDecimal("650.00")).unit("Pack").stockQuantity(25).reorderLevel(8).category(produce).imageUrl("https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Green Bell Peppers (Capsicum) 250g").description("Crunchy green bell peppers with a crisp flavor for stir-fries and fresh salads.").price(new BigDecimal("280.00")).unit("Pack").stockQuantity(35).reorderLevel(10).category(produce).imageUrl("https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),

                // 15-17 Additional Dairy & Eggs
                Product.builder().name("Anchor Pure Salted Butter 227g").description("Rich, creamy grass-fed dairy butter made from 100% pure New Zealand milk.").price(new BigDecimal("950.00")).unit("Pack").stockQuantity(40).reorderLevel(10).category(dairy).imageUrl("https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Highland Traditional Buffalo Curd 500ml").description("Creamy and thick traditional Sri Lankan curd in an authentic clay pot.").price(new BigDecimal("340.00")).unit("Clay Pot").stockQuantity(30).reorderLevel(8).category(dairy).imageUrl("https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Greek Style Natural Plain Yogurt 400g").description("High-protein, thick and creamy strained Greek-style yogurt with live probiotics.").price(new BigDecimal("580.00")).unit("Tub").stockQuantity(20).reorderLevel(6).category(dairy).imageUrl("https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),

                // 18-20 Additional Beverages
                Product.builder().name("Ceylon Supreme Black Tea (50 Tea Bags)").description("Authentic single-origin Dimbula high-grown Ceylon black tea with brisk aroma.").price(new BigDecimal("520.00")).unit("Box").stockQuantity(55).reorderLevel(15).category(beverages).imageUrl("https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Thambili King Coconut Water 330ml").description("Natural isotonic electrolyte beverage harvested fresh from golden coconuts.").price(new BigDecimal("260.00")).unit("Bottle").stockQuantity(40).reorderLevel(12).category(beverages).imageUrl("https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Kotmale Mist Arabica Dark Roast Coffee 250g").description("Locally roasted highland whole Arabica coffee beans with rich dark cocoa notes.").price(new BigDecimal("1450.00")).unit("Pack").stockQuantity(22).reorderLevel(5).category(beverages).imageUrl("https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),

                // 21-23 Additional Bakery & Snacks
                Product.builder().name("Golden Flaky Butter Croissants (2-pack)").description("Freshly baked French-style pastry with rich buttery layers and crisp flaky crust.").price(new BigDecimal("480.00")).unit("Pack").stockQuantity(16).reorderLevel(6).category(bakery).imageUrl("https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Munchee Chocolate Puff Biscuits 400g").description("Crispy cocoa puff biscuits filled with rich smooth chocolate cream.").price(new BigDecimal("340.00")).unit("Pack").stockQuantity(70).reorderLevel(20).category(bakery).imageUrl("https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Premium Roasted Salted Cashew Nuts 200g").description("Crisp jumbo Sri Lankan cashew nuts, oven roasted and lightly sea salted.").price(new BigDecimal("1650.00")).unit("Pouch").stockQuantity(28).reorderLevel(8).category(bakery).imageUrl("https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),

                // 24-27 Additional Meat & Seafood
                Product.builder().name("Wild Caught Yellowfin Tuna Steaks 500g").description("Sashimi-grade fresh yellowfin tuna steaks sourced sustainably from deep waters.").price(new BigDecimal("1850.00")).unit("500g Pack").stockQuantity(15).reorderLevel(5).category(meat).imageUrl("https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Jumbo Tiger Prawns (Cleaned) 400g").description("Succulent ocean tiger prawns, deveined and deshelled with tail on.").price(new BigDecimal("2100.00")).unit("Pack").stockQuantity(18).reorderLevel(5).category(meat).imageUrl("https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Farm Whole Chicken Curry Cut 1kg").description("Clean skin-on tender chicken pieces with bone, ideal for village curry dishes.").price(new BigDecimal("1380.00")).unit("1kg Pack").stockQuantity(35).reorderLevel(10).category(meat).imageUrl("https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Atlantic Salmon Fillet 250g").description("Omega-3 rich premium skin-on pink salmon portion, pan-sear ready.").price(new BigDecimal("2450.00")).unit("Portion").stockQuantity(12).reorderLevel(4).category(meat).imageUrl("https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),

                // 28-32 Additional Pantry & Staples
                Product.builder().name("Cold-Pressed Extra Virgin Olive Oil 500ml").description("First cold-pressed Mediterranean extra virgin olive oil with fruity aroma.").price(new BigDecimal("1950.00")).unit("Bottle").stockQuantity(30).reorderLevel(8).category(pantry).imageUrl("https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Pure Kithul Palm Treacle 375ml").description("100% natural wild harvested artisanal kithul palm nectar with no added sugar.").price(new BigDecimal("850.00")).unit("Bottle").stockQuantity(26).reorderLevel(7).category(pantry).imageUrl("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Pure Ceylon Alba Cinnamon Quills 100g").description("True Ceylon organic Alba-grade cinnamon quills with sweet, delicate aroma.").price(new BigDecimal("720.00")).unit("Pouch").stockQuantity(50).reorderLevel(15).category(pantry).imageUrl("https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Organic Traditional Red Raw Rice 5kg").description("Nutrient-dense Sri Lankan unpolished red raw rice, rich in natural fiber.").price(new BigDecimal("1100.00")).unit("5kg Bag").stockQuantity(40).reorderLevel(12).category(pantry).imageUrl("https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Rich Coconut Milk Can 400ml").description("Creamy first-extract organic coconut milk with 17% fat content, preservative-free.").price(new BigDecimal("390.00")).unit("Can").stockQuantity(65).reorderLevel(20).category(pantry).imageUrl("https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build()
        );

        for (Product p : sampleProducts) {
            if (!productRepository.existsByName(p.getName())) {
                productRepository.save(p);
            }
        }
    }

    private void initSuppliers() {
        List<Supplier> suppliers = Arrays.asList(
                Supplier.builder().name("Lanka Dairies Ltd").contactName("Nimal Karunaratne").email("orders@lankadairies.lk").phone("0112345678").address("Kaduwela Road, Malabe").build(),
                Supplier.builder().name("Ceylon Agro Farms").contactName("Kamal Senanayake").email("supply@ceylonagro.lk").phone("0118765432").address("Puttalam Road, Kurunegala").build()
        );
        supplierRepository.saveAll(suppliers);
    }

    private void initPromotions() {
        Promotion promo1 = Promotion.builder()
                .name("Weekend Fresh Harvest Sale")
                .code("WEEKEND15")
                .description("Get up to 15% OFF on all organic vegetables and farm fruits!")
                .discountPercentage(new BigDecimal("15.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .isActive(true)
                .build();

        Promotion promo2 = Promotion.builder()
                .name("Dairy Super Saver")
                .code("DAIRY10")
                .description("Enjoy 10% OFF on all cheese and pasteurized milk items.")
                .discountPercentage(new BigDecimal("10.00"))
                .startDate(LocalDateTime.now().minusDays(2))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build();

        promotionRepository.saveAll(Arrays.asList(promo1, promo2));
    }
}
