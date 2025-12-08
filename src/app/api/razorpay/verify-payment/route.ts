import { NextRequest, NextResponse } from "next/server";
// Force rebuild
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";

// Since we are using supabaseAdmin which requires the service role key, this is always true
const isUsingServiceRole = true;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Payment verified successfully - now create order in database
    if (orderData) {
      try {
        // Generate order ID
        const orderId = `MO-${Date.now()}`;

        // Always use the userId from orderData if available
        const userId = orderData.userId || null;

        let orderUuid: string;
        let order: any;

        if (isUsingServiceRole) {
          // Use service role key - bypasses RLS directly
          const { data: insertedOrder, error: orderError } =
            await supabaseAdmin
              .from("orders")
              .insert({
                order_id: orderId,
                razorpay_order_id,
                razorpay_payment_id,
                user_id: userId,
                customer_name: orderData.customerName,
                customer_email: orderData.customerEmail,
                customer_phone: orderData.customerPhone,
                shipping_address: orderData.shippingAddress,
                subtotal: orderData.subtotal,
                discount: orderData.discount || 0,
                total: orderData.total,
                coupon_code: orderData.couponCode || null,
                status: "confirmed",
                payment_status: "paid",
                payment_method: "razorpay",
              })
              .select()
              .single();

          if (orderError) {
            console.error("Error creating order:", orderError);
            throw new Error(`Failed to create order: ${orderError.message}`);
          }

          if (!insertedOrder) {
            throw new Error("Order creation failed - no order returned");
          }

          order = insertedOrder;
          orderUuid = insertedOrder.id;
        } else {
          // Use database function with SECURITY DEFINER to bypass RLS
          const { data: functionResult, error: functionError } =
            await supabaseAdmin.rpc("insert_order_with_user", {
              p_order_id: orderId,
              p_razorpay_order_id: razorpay_order_id,
              p_razorpay_payment_id: razorpay_payment_id,
              p_user_id: userId,
              p_customer_name: orderData.customerName,
              p_customer_email: orderData.customerEmail,
              p_customer_phone: orderData.customerPhone,
              p_shipping_address: orderData.shippingAddress,
              p_subtotal: orderData.subtotal,
              p_discount: orderData.discount || 0,
              p_total: orderData.total,
              p_coupon_code: orderData.couponCode || null,
              p_status: "confirmed",
              p_payment_status: "paid",
              p_payment_method: "razorpay",
            });

          if (functionError) {
            console.error("Error creating order via function:", functionError);
            throw new Error(`Failed to create order: ${functionError.message}`);
          }

          if (!functionResult) {
            throw new Error("Order creation failed - no UUID returned");
          }

          orderUuid = functionResult;

          // Fetch the created order using function with SECURITY DEFINER
          const { data: fetchedOrder, error: fetchError } =
            await supabaseAdmin.rpc("get_order_by_id", {
              p_order_uuid: orderUuid,
            });

          if (fetchError || !fetchedOrder || fetchedOrder.length === 0) {
            console.error("Error fetching created order:", fetchError);
            throw new Error("Order created but failed to fetch details");
          }

          // Function returns an array, get first result
          order = Array.isArray(fetchedOrder) ? fetchedOrder[0] : fetchedOrder;
        }

        console.log("Order created successfully:", order.id, order.order_id);

        // Insert order items
        if (
          orderData.items &&
          Array.isArray(orderData.items) &&
          orderData.items.length > 0
        ) {
          if (isUsingServiceRole) {
            // Direct insert with service role
            const orderItems = orderData.items.map((item: any) => ({
              order_id: orderUuid,
              product_id: item.productId,
              product_name: item.productName,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
            }));

            const { data: insertedItems, error: itemsError } =
              await supabaseAdmin
                .from("order_items")
                .insert(orderItems)
                .select();

            if (itemsError) {
              console.error("Error creating order items:", itemsError);
              throw new Error(
                `Failed to create order items: ${itemsError.message}`
              );
            }

            console.log(
              "Order items created successfully:",
              insertedItems?.length || 0
            );
          } else {
            // Use function to insert items
            const itemsArray = orderData.items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
            }));

            const { error: itemsError } = await supabaseAdmin.rpc(
              "insert_order_items",
              {
                p_order_id: orderUuid,
                p_items: itemsArray as any, // JSONB array
              }
            );

            if (itemsError) {
              console.error(
                "Error creating order items via function:",
                itemsError
              );
              throw new Error(
                `Failed to create order items: ${itemsError.message}`
              );
            }

            console.log("Order items created successfully via function");
          }

          // Decrease stock for each order item
          try {
            const stockUpdates = new Map<
              string,
              { size: string; quantity: number }[]
            >();

            // Group items by product_id
            orderData.items.forEach((item: any) => {
              const productId = item.productId;
              if (!stockUpdates.has(productId)) {
                stockUpdates.set(productId, []);
              }
              stockUpdates.get(productId)!.push({
                size: item.size,
                quantity: item.quantity,
              });
            });

            // Update stock for each product
            for (const [productId, items] of stockUpdates.entries()) {
              // Fetch current product to get sizes
              const { data: product, error: productError } =
                await supabaseAdmin
                  .from("products")
                  .select("sizes")
                  .eq("id", productId)
                  .single();

              if (productError || !product) {
                console.error(
                  `Error fetching product ${productId} for stock update:`,
                  productError
                );
                continue;
              }

              // Update sizes object
              const currentSizes = (product.sizes as Record<string, number>) || {};
              const updatedSizes = { ...currentSizes };

              items.forEach(({ size, quantity }) => {
                const currentStock = updatedSizes[size] || 0;
                const newStock = Math.max(0, currentStock - quantity);
                updatedSizes[size] = newStock;
              });

              // Update product stock
              const { error: updateError } = await supabaseAdmin
                .from("products")
                .update({ sizes: updatedSizes })
                .eq("id", productId);

              if (updateError) {
                console.error(
                  `Error updating stock for product ${productId}:`,
                  updateError
                );
              } else {
                console.log(
                  `Stock decreased successfully for product ${productId}`
                );
              }
            }
          } catch (stockError) {
            console.error("Error updating stock:", stockError);
            // Don't fail the order if stock update fails, but log it
          }
        }

        // Increment coupon usage count if a coupon was used
        if (orderData.couponCode) {
          try {
            const couponCode = orderData.couponCode.trim();
            console.log(
              "Attempting to increment coupon usage for:",
              couponCode
            );

            // Use database function for atomic increment (case-sensitive)
            const { data: rpcResult, error: couponUpdateError } =
              await supabaseAdmin.rpc("increment_coupon_usage", {
                p_coupon_code: couponCode,
              });

            if (couponUpdateError) {
              console.error(
                "Error incrementing coupon usage count:",
                couponUpdateError
              );
              // Try direct update as fallback
              const { data: couponData } = await supabaseAdmin
                .from("coupons")
                .select("usage_count")
                .eq("code", couponCode)
                .single();

              if (couponData) {
                const { error: directUpdateError } = await supabaseAdmin
                  .from("coupons")
                  .update({ usage_count: (couponData.usage_count || 0) + 1 })
                  .eq("code", couponCode);

                if (directUpdateError) {
                  console.error(
                    "Direct update also failed:",
                    directUpdateError
                  );
                } else {
                  console.log(
                    "Coupon usage count incremented via direct update:",
                    couponCode
                  );
                }
              } else {
                console.error("Coupon not found for code:", couponCode);
              }
              // Don't fail the order if coupon update fails
            } else {
              console.log(
                "Coupon usage count incremented successfully:",
                couponCode
              );
            }
          } catch (couponError) {
            console.error("Error incrementing coupon usage:", couponError);
            // Don't fail the order if coupon update fails
          }
        }

        // Send Order Confirmation Email via MSG91
        try {
          const itemsList = orderData.items
            .map(
              (item: any) =>
                `${item.productName} (Size: ${item.size}) x ${item.quantity} - ₹${item.price}`
            )
            .join("<br>");

          const emailResponse = await fetch(
            "https://control.msg91.com/api/v5/email/send",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authkey: process.env.MSG91_AUTH_KEY!,
              },
              body: JSON.stringify({
                recipients: [
                  {
                    to: [
                      {
                        email: orderData.customerEmail,
                        name: orderData.customerName,
                      },
                    ],
                    variables: {
                      customer_name: orderData.customerName,
                      order_id: order.order_id,
                      order_date: new Date().toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                      order_total: `₹${orderData.total}`,
                      items_list: itemsList,
                    },
                  },
                ],
                from: {
                  email: "no-reply@themollywoodclothing.com",
                },
                domain: "themollywoodclothing.com",
                template_id: "mollywood_order",
              }),
            }
          );

          if (!emailResponse.ok) {
            const emailData = await emailResponse.json();
            console.error("Failed to send order confirmation email:", emailData);
          } else {
            console.log("Order confirmation email sent successfully");
          }
        } catch (emailError) {
          console.error("Error sending order confirmation email:", emailError);
          // Don't fail the order if email fails
        }

        return NextResponse.json({
          success: true,
          orderId: order.order_id,
          orderUuid: orderUuid,
          message: "Payment verified and order created successfully",
        });
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        // Payment is verified but order creation failed
        return NextResponse.json(
          {
            success: true,
            message: "Payment verified but order creation failed",
            error: dbError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
