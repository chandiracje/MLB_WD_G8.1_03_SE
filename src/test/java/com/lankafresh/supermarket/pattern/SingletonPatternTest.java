package com.lankafresh.supermarket.pattern;

import com.lankafresh.supermarket.pattern.singleton.SupermarketSystemConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for Singleton Design Pattern.
 * 
 * Lecture Slide Reference:
 * - SE2030 Lecture 8: Design Patterns - Part I (Slides 14-27)
 *   Slide 24: "Singleton obj1 = Singleton.getInstance();
 *              Singleton obj2 = Singleton.getInstance();
 *              System.out.println(obj1 == obj2); // true"
 */
class SingletonPatternTest {

    @Test
    @DisplayName("Verify Singleton returns identical instance reference (Slide 24)")
    void testSingleInstanceReference() {
        SupermarketSystemConfig instance1 = SupermarketSystemConfig.getInstance();
        SupermarketSystemConfig instance2 = SupermarketSystemConfig.getInstance();

        assertNotNull(instance1, "Singleton instance should never be null");
        assertSame(instance1, instance2, "Both calls to getInstance() must return the exact same instance in memory");
        assertEquals(System.identityHashCode(instance1), System.identityHashCode(instance2));
    }

    @Test
    @DisplayName("Verify Constructor is private (Step #1 - Slide 18)")
    void testPrivateConstructor() {
        Constructor<?>[] constructors = SupermarketSystemConfig.class.getDeclaredConstructors();
        assertEquals(1, constructors.length, "Class should declare exactly one constructor");
        assertTrue(Modifier.isPrivate(constructors[0].getModifiers()), "Constructor MUST be marked private to prevent new instantiation");
    }

    @Test
    @DisplayName("Verify Thread Safety across concurrent multi-threaded requests (Slide 27)")
    void testConcurrentThreadSafety() throws InterruptedException {
        int threadCount = 30;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        List<SupermarketSystemConfig> retrievedInstances = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    retrievedInstances.add(SupermarketSystemConfig.getInstance());
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(threadCount, retrievedInstances.size());
        SupermarketSystemConfig firstInstance = retrievedInstances.get(0);
        for (SupermarketSystemConfig current : retrievedInstances) {
            assertSame(firstInstance, current, "All concurrent threads must receive the identical singleton instance");
        }
    }

    @Test
    @DisplayName("Verify Singleton state mutation persists globally")
    void testStatePersistence() {
        SupermarketSystemConfig config = SupermarketSystemConfig.getInstance();
        config.resetToDefaults();

        config.setStandardDeliveryFee(new BigDecimal("300.00"));
        config.setCurrencyCode("LKR");

        SupermarketSystemConfig anotherReference = SupermarketSystemConfig.getInstance();
        assertEquals(new BigDecimal("300.00"), anotherReference.getStandardDeliveryFee());
        assertEquals("LKR", anotherReference.getCurrencyCode());

        config.resetToDefaults();
    }
}
