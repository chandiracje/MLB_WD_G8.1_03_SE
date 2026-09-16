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
        if (categoryRepository.count() == 0) {
            initCategoriesAndProducts();
        }
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

    private void initCategoriesAndProducts() {
        Category produce = categoryRepository.save(Category.builder().name("Fresh Produce").build());
        Category dairy = categoryRepository.save(Category.builder().name("Dairy & Eggs").build());
        Category beverages = categoryRepository.save(Category.builder().name("Beverages").build());
        Category bakery = categoryRepository.save(Category.builder().name("Bakery & Snacks").build());
        Category meat = categoryRepository.save(Category.builder().name("Meat & Seafood").build());
        Category pantry = categoryRepository.save(Category.builder().name("Pantry & Staples").build());

        List<Product> sampleProducts = Arrays.asList(
                Product.builder().name("Organic Fresh Bananas").description("Farm-fresh sweet Cavendish bananas, rich in potassium and energy.").price(new BigDecimal("350.00")).unit("kg").stockQuantity(50).reorderLevel(15).category(produce).imageUrl("https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Red Apples").description("Crisp and juicy Royal Gala apples imported directly from orchards.").price(new BigDecimal("780.00")).unit("kg").stockQuantity(30).reorderLevel(10).category(produce).imageUrl("https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Highland Fresh Pasteurized Milk").description("1L pure whole dairy milk rich in calcium and vitamin D.").price(new BigDecimal("480.00")).unit("1L Bottle").stockQuantity(40).reorderLevel(12).category(dairy).imageUrl("https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Kotmale Cheddar Cheese 200g").description("Premium aged natural cheddar cheese block with rich creamy texture.").price(new BigDecimal("890.00")).unit("Pack").stockQuantity(25).reorderLevel(8).category(dairy).imageUrl("https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Farm Fresh Brown Eggs (Pack of 10)").description("Grade A farm fresh cage-free eggs with guaranteed quality.").price(new BigDecimal("560.00")).unit("Pack").stockQuantity(35).reorderLevel(10).category(dairy).imageUrl("https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Ceylon Pure Pure Green Tea 100g").description("Hand-picked premium loose-leaf Ceylon green tea with natural antioxidants.").price(new BigDecimal("650.00")).unit("Box").stockQuantity(45).reorderLevel(15).category(beverages).imageUrl("https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Orange Juice 1L").description("100% natural cold pressed orange juice with no added sugar.").price(new BigDecimal("720.00")).unit("Bottle").stockQuantity(8).reorderLevel(10).category(beverages).imageUrl("https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Artisan Sourdough Bread 450g").description("Naturally fermented crusty artisan sourdough bread baked fresh daily.").price(new BigDecimal("420.00")).unit("Loaf").stockQuantity(18).reorderLevel(5).category(bakery).imageUrl("https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Fresh Chicken Breast Boneless 500g").description("Tender and skinless fresh chicken breast cuts, antibiotic free.").price(new BigDecimal("1150.00")).unit("500g Pack").stockQuantity(20).reorderLevel(6).category(meat).imageUrl("https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build(),
                Product.builder().name("Premium Basmati Rice 5kg").description("Long-grain fragrant aged royal basmati rice for festive meals.").price(new BigDecimal("2350.00")).unit("5kg Bag").stockQuantity(60).reorderLevel(20).category(pantry).imageUrl("https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80").isDiscontinued(false).build()
        );

        productRepository.saveAll(sampleProducts);
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
