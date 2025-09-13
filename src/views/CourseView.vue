<template>
  <div class="">
    <div class="flex flex-col gap-8 mb-16 lg:flex-row lg:items-start">
      <div class="flex gap-4 lg:max-w-none">
        <div class="flex-col hidden gap-4 sm:flex lg:min-w-24">
          <img
            v-for="(image, i) of images"
            :key="image"
            :src="
              'https://fqjltiegiezfetthbags.supabase.co/storage/v1/object/public/block.images/blocks/ecommerce/productoverview/' +
              image
            "
            class="object-cover w-24 transition-all duration-150 rounded-lg cursor-pointer h-28"
            :class="{
              'shadow-[0_0_0_2px] shadow-surface-900 dark:shadow-surface-0 ring-2 ring-surface-900 dark:ring-surface-0 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-950':
                selectedImageIndex === i,
              '': selectedImageIndex !== i,
            }"
            @click="selectedImageIndex = i"
            alt="Product thumbnail"
          />
        </div>
        <div>
          <img
            :src="
              'https://fqjltiegiezfetthbags.supabase.co/storage/v1/object/public/block.images/blocks/ecommerce/productoverview/' +
              images[selectedImageIndex]
            "
            class="w-full h-auto lg:max-h-[31.28rem] lg:min-w-132 lg:max-w-132 rounded-lg"
            alt="Product main image"
          />

          <div class="flex h-32 gap-2 mt-4 sm:hidden">
            <img
              v-for="(image, i) of images"
              :key="image"
              :src="
                'https://fqjltiegiezfetthbags.supabase.co/storage/v1/object/public/block.images/blocks/ecommerce/productoverview/' +
                image
              "
              class="flex-1 object-cover h-auto transition-all duration-150 rounded-md cursor-pointer min-w-16 sm:min-w-20 md:min-w-24 max-h-28 sm:rounded-lg"
              :class="{
                'shadow-[0_0_0_2px] shadow-surface-900 dark:shadow-surface-0 ring-2 ring-surface-900 dark:ring-surface-0 ring-offset-1 sm:ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-950':
                  selectedImageIndex === i,
                '': selectedImageIndex !== i,
              }"
              @click="selectedImageIndex = i"
              alt="Product thumbnail"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col flex-1 w-full gap-8 p-5">
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-4">
            <h1
              class="flex-1 text-xl font-semibold leading-tight text-surface-900 dark:text-surface-0"
            >
              RidgeTrail Modular Camera Backpack
            </h1>
          </div>
          <div class="flex items-center justify-between gap-4">
            <div class="text-2xl font-normal leading-tight text-surface-900 dark:text-surface-0">
              $279
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <i class="pi pi-star-fill text-sm! leading-none! text-yellow-500" />
                <i class="pi pi-star-fill text-sm! leading-none! text-yellow-500" />
                <i class="pi pi-star-fill text-sm! leading-none! text-yellow-500" />
                <i class="pi pi-star-fill text-sm! leading-none! text-yellow-500" />
                <i
                  class="pi pi-star text-sm! leading-none! text-surface-400 dark:text-surface-500"
                />
              </div>
              <div class="text-xs leading-tight">
                <span class="font-bold text-surface-900 dark:text-surface-0">58 </span>
                <span class="text-surface-500 dark:text-surface-400">reviews</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="text-sm font-semibold leading-tight text-surface-900 dark:text-surface-0">
            Color
          </div>
          <div class="flex items-center gap-4">
            <div
              class="transition-all duration-150 rounded-full cursor-pointer w-7 h-7 bg-zinc-900 outline outline-2 outline-surface-0 dark:outline-surface-950"
              :class="
                color === 'black'
                  ? 'ring-2 ring-zinc-900 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-950'
                  : ''
              "
              @click="color = 'black'"
            />
            <div
              class="transition-all duration-150 rounded-full cursor-pointer w-7 h-7 bg-zinc-500 outline outline-2 outline-surface-0 dark:outline-surface-950"
              :class="
                color === 'gray'
                  ? 'ring-2 ring-zinc-500 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-950'
                  : ''
              "
              @click="color = 'gray'"
            />
            <div
              class="transition-all duration-150 rounded-full cursor-pointer w-7 h-7 bg-zinc-300 outline outline-2 outline-surface-0 dark:outline-surface-950"
              :class="
                color === 'light'
                  ? 'ring-2 ring-zinc-300 ring-offset-2 ring-offset-surface-0 dark:ring-offset-surface-950'
                  : ''
              "
              @click="color = 'light'"
            />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-4">
            <div
              class="flex-1 text-sm font-semibold leading-tight text-surface-900 dark:text-surface-0"
            >
              Size
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div
              :class="[
                'py-2 px-4 rounded-md cursor-pointer transition-all duration-150 text-sm font-normal leading-normal',
                size === '10L'
                  ? 'bg-primary-50 dark:bg-primary-900/20 outline outline-2 outline-primary text-primary'
                  : 'outline outline-1 outline-surface-200 dark:outline-surface-700 text-surface-900 dark:text-surface-0 hover:bg-surface-50 dark:hover:bg-surface-800',
              ]"
              @click="size = '10L'"
            >
              10L
            </div>
            <div
              :class="[
                'py-2 px-4 rounded-md cursor-pointer transition-all duration-150 text-sm font-normal leading-normal',
                size === '15L'
                  ? 'bg-primary-50 dark:bg-primary-900/20 outline outline-2 outline-primary text-primary'
                  : 'outline outline-1 outline-surface-200 dark:outline-surface-700 text-surface-900 dark:text-surface-0 hover:bg-surface-50 dark:hover:bg-surface-800',
              ]"
              @click="size = '15L'"
            >
              15L
            </div>
            <div
              :class="[
                'py-2 px-4 rounded-md cursor-pointer transition-all duration-150 text-sm font-normal leading-normal',
                size === '20L'
                  ? 'bg-primary-50 dark:bg-primary-900/20 outline outline-2 outline-primary text-primary'
                  : 'outline outline-1 outline-surface-200 dark:outline-surface-700 text-surface-900 dark:text-surface-0 hover:bg-surface-50 dark:hover:bg-surface-800',
              ]"
              @click="size = '20L'"
            >
              20L
            </div>
            <div
              :class="[
                'py-2 px-4 rounded-md cursor-pointer transition-all duration-150 text-sm font-normal leading-normal',
                size === '25L'
                  ? 'bg-primary-50 dark:bg-primary-900/20 outline outline-2 outline-primary text-primary'
                  : 'outline outline-1 outline-surface-200 dark:outline-surface-700 text-surface-900 dark:text-surface-0 hover:bg-surface-50 dark:hover:bg-surface-800',
              ]"
              @click="size = '25L'"
            >
              25L
            </div>
            <div
              class="opacity-20"
              :class="[
                'py-2 px-4 rounded-md cursor-pointer transition-all duration-150 text-sm font-normal leading-normal',
                size === '30L'
                  ? 'bg-primary-50 dark:bg-primary-900/20 outline outline-2 outline-primary text-primary'
                  : 'outline outline-1 outline-surface-200 dark:outline-surface-700 text-surface-900 dark:text-surface-0',
              ]"
            >
              30L
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-4">
            <div class="text-sm font-semibold leading-tight text-surface-900 dark:text-surface-0">
              Quantity
            </div>
            <InputNumber
              v-model="quantity"
              :show-buttons="true"
              button-layout="horizontal"
              spinner-mode="horizontal"
              :min="0"
              class="w-32"
              input-class="w-12 text-center"
              decrement-button-class="p-button-text"
              increment-button-class="p-button-text"
              increment-button-icon="pi pi-plus"
              decrement-button-icon="pi pi-minus"
            />
          </div>
          <div class="flex items-center gap-4">
            <Button
              class="flex-1 py-2! px-4! bg-surface-900! dark:bg-surface-0! text-surface-0! dark:text-surface-900! border-surface-900! dark:border-surface-0! rounded-md! font-medium! text-sm!"
              label="Add to Cart"
            />
            <Button
              class="w-9! h-9! p-2! bg-surface-100! dark:bg-surface-800! text-surface-600! dark:text-surface-300! border-surface-100! dark:border-surface-800! rounded-full! min-w-0!"
              icon="pi pi-heart"
              :class="{
                'text-pink-500! dark:text-pink-400!': liked,
              }"
              @click="liked = !liked"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-8">
      <div class="flex flex-col gap-2">
        <div class="flex items-end">
          <div
            class="flex flex-col transition-colors duration-150 cursor-pointer rounded-t-md"
            @click="activeTab = 0"
          >
            <div class="flex items-center gap-2 px-5 py-5">
              <div
                class="text-base font-bold leading-tight"
                :class="activeTab === 0 ? 'text-primary' : 'text-surface-500 dark:text-surface-400'"
              >
                Details
              </div>
            </div>
            <div
              class="h-0.5"
              :class="activeTab === 0 ? 'bg-primary' : 'bg-surface-200 dark:bg-surface-700'"
            ></div>
          </div>
          <div
            class="flex flex-col transition-colors duration-150 cursor-pointer rounded-t-md"
            @click="activeTab = 1"
          >
            <div class="flex items-center gap-2 px-5 py-5">
              <div
                class="text-base font-semibold leading-tight"
                :class="activeTab === 1 ? 'text-primary' : 'text-surface-500 dark:text-surface-400'"
              >
                Reviews
              </div>
            </div>
            <div
              class="h-0.5"
              :class="activeTab === 1 ? 'bg-primary' : 'bg-surface-200 dark:bg-surface-700'"
            ></div>
          </div>
          <div
            class="flex flex-col transition-colors duration-150 cursor-pointer rounded-t-md"
            @click="activeTab = 2"
          >
            <div class="flex items-center gap-2 px-5 py-5">
              <div
                class="text-base font-semibold leading-tight"
                :class="activeTab === 2 ? 'text-primary' : 'text-surface-500 dark:text-surface-400'"
              >
                Shipping
              </div>
            </div>
            <div
              class="h-0.5"
              :class="activeTab === 2 ? 'bg-primary' : 'bg-surface-200 dark:bg-surface-700'"
            ></div>
          </div>
          <div class="flex-1 h-0.5 bg-surface-200 dark:bg-surface-700"></div>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div v-if="activeTab === 0" class="flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <h3 class="text-2xl font-medium leading-tight text-surface-900 dark:text-surface-0">
              Made to Move
            </h3>
            <p class="text-base font-normal leading-normal text-surface-500 dark:text-surface-400">
              Built for adventure and designed for creators, the RidgeTrail Modular Camera Backpack
              keeps your gear protected, organized, and ready for any terrain.<br />
              Whether you're hiking remote landscapes or navigating urban shoots, this bag delivers
              durability without compromise.
            </p>
          </div>

          <div class="flex flex-col gap-2 md:flex-row">
            <div class="flex flex-col flex-1 gap-4 p-4">
              <h4 class="text-xl font-medium leading-tight text-surface-900 dark:text-surface-0">
                Highlights
              </h4>
              <ul
                class="pl-4 space-y-1 font-normal list-disc text-surface-500 dark:text-surface-400"
              >
                <li>Customizable interior dividers for total control</li>
                <li>Side-access zipper for fast lens swaps</li>
                <li>Weather-resistant shell with reinforced stitching</li>
              </ul>
            </div>

            <div class="flex flex-col flex-1 gap-4 p-4">
              <h4 class="text-xl font-medium leading-tight text-surface-900 dark:text-surface-0">
                Size and Fit
              </h4>
              <div class="flex flex-col gap-2">
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >10L Mirrorless Kit:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Fits 1 mirrorless body + 2–3 lenses</span
                  >
                </div>
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >15L Compact DSLR:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Fits DSLR + 2–3 lenses</span
                  >
                </div>
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >20L DSLR Standard:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Fits DSLR + 3–5 lenses + flash</span
                  >
                </div>
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >25L Pro:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Full-frame DSLR + 6+ lenses + tripod</span
                  >
                </div>
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >30L Pro Max:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Drone space + accessory compartments</span
                  >
                </div>
              </div>
            </div>

            <div class="flex flex-col flex-1 gap-4 p-4">
              <h4 class="text-xl font-medium leading-tight text-surface-900 dark:text-surface-0">
                Material & Care
              </h4>
              <div class="flex gap-2">
                <div class="flex flex-col flex-1 gap-4 p-2">
                  <div class="flex items-center gap-2">
                    <i
                      class="pi pi-sun text-base! leading-none! text-surface-700 dark:text-surface-200"
                    />
                    <span
                      class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                      >Not dryer safe</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <i
                      class="pi pi-sliders-h text-base! leading-none! text-surface-700 dark:text-surface-200"
                    />
                    <span
                      class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                      >Iron medium heat</span
                    >
                  </div>
                </div>
                <div class="flex flex-col flex-1 gap-4 p-2">
                  <div class="flex items-center gap-2">
                    <i
                      class="pi pi-times-circle text-base! leading-none! text-surface-700 dark:text-surface-200"
                    />
                    <span
                      class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                      >No chemical wash</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <i
                      class="pi pi-minus-circle text-base! leading-none! text-surface-700 dark:text-surface-200"
                    />
                    <span
                      class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                      >Dry flat</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 1" class="flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <h3 class="text-2xl font-medium leading-tight text-surface-900 dark:text-surface-0">
              Customer Reviews
            </h3>
            <p class="text-base font-normal leading-normal text-surface-500 dark:text-surface-400">
              See what our customers are saying about the RidgeTrail Modular Camera Backpack.
            </p>
          </div>

          <div class="flex flex-col gap-4">
            <template v-for="(review, idx) in reviews" :key="review.name">
              <div
                class="flex flex-col self-stretch gap-4 p-4 rounded-xl bg-surface-0 dark:bg-surface-950"
              >
                <div class="flex items-center gap-4">
                  <div class="flex items-center flex-1 gap-4">
                    <img :src="review.avatar" class="w-12 h-12 rounded-full" :alt="review.name" />
                    <div class="flex flex-col flex-1">
                      <span
                        class="text-base font-medium leading-tight text-surface-900 dark:text-surface-0"
                        >{{ review.name }}</span
                      >
                      <span class="text-sm font-medium text-surface-400 dark:text-surface-500">{{
                        review.date
                      }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="flex items-start gap-1">
                      <i
                        v-for="n in 5"
                        :key="n"
                        :class="[
                          'pi',
                          n <= review.rating
                            ? 'pi-star-fill text-yellow-500'
                            : 'pi-star text-surface-300 dark:text-surface-600',
                          'text-sm! leading-none!',
                        ]"
                      />
                    </div>
                    <span
                      class="text-base font-medium leading-tight text-surface-900 dark:text-surface-0"
                      >{{ review.rating }}</span
                    >
                  </div>
                </div>
                <p
                  class="text-base font-normal leading-normal text-surface-700 dark:text-surface-300"
                >
                  {{ review.comment }}
                </p>
              </div>

              <div
                v-if="idx < reviews.length - 1"
                class="w-full h-px bg-surface-200 dark:bg-surface-700"
              ></div>
            </template>
          </div>
        </div>

        <div v-if="activeTab === 2" class="flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <h3 class="text-2xl font-medium leading-tight text-surface-900 dark:text-surface-0">
              Shipping Information
            </h3>
            <p class="text-base font-normal leading-normal text-surface-500 dark:text-surface-400">
              Free shipping on orders over $200. All orders are processed within 1-2 business days
              and shipped via reliable carriers with tracking information provided.
            </p>
          </div>

          <div class="flex flex-col gap-2 md:flex-row">
            <div class="flex flex-col flex-1 gap-4 p-4">
              <h4 class="text-xl font-medium leading-tight text-surface-900 dark:text-surface-0">
                Shipping Costs
              </h4>
              <ul
                class="pl-4 space-y-1 font-normal list-disc text-surface-500 dark:text-surface-400"
              >
                <li>Standard (5-7 days) - $9.99</li>
                <li>Express (2-3 days) - $19.99</li>
                <li>Overnight - $39.99</li>
                <li>International - Starting at $29.99</li>
              </ul>
            </div>

            <div class="flex flex-col flex-1 gap-4 p-4">
              <h4 class="text-xl font-medium leading-tight text-surface-900 dark:text-surface-0">
                Return Policy
              </h4>
              <p
                class="text-base font-normal leading-normal text-surface-500 dark:text-surface-400"
              >
                30-day return policy. Items must be in original condition with all tags attached.
                Return shipping is free for defective items.
              </p>
            </div>

            <div class="flex flex-col flex-1 gap-4 p-4">
              <h4 class="text-xl font-medium leading-tight text-surface-900 dark:text-surface-0">
                Delivery Options
              </h4>
              <div class="flex flex-col gap-2">
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >Same Day:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Available in select cities</span
                  >
                </div>
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >Pickup:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Free at our retail locations</span
                  >
                </div>
                <div>
                  <span
                    class="text-base font-medium leading-tight text-surface-700 dark:text-surface-200"
                    >Gift Wrapping:</span
                  >
                  <span
                    class="text-base font-normal leading-tight text-surface-500 dark:text-surface-400"
                  >
                    Available for $4.99</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import { ref } from 'vue';

const color = ref('black');
const size = ref('20L');
const liked = ref(false);
const images = ref(['tabs-1.jpg', 'tabs-2.jpg', 'tabs-3.jpg', 'tabs-4.jpg']);
const selectedImageIndex = ref(0);
const quantity = ref(1);
const activeTab = ref(0);
const reviews = ref([
  {
    name: 'Eleanor Pena',
    date: '2 days ago',
    rating: 4,
    avatar:
      'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/avatars/avatar-kathryn.png',
    comment:
      'Perfect backpack for daily commuting and weekend trips! The build quality is exceptional and it fits my laptop perfectly. Multiple compartments keep everything organized. Comfortable straps even when fully loaded.',
  },
  {
    name: 'Wade Warren',
    date: '4 days ago',
    rating: 4,
    avatar:
      'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/avatars/avatar-paul.png',
    comment:
      'Amazing backpack that exceeded my expectations! Waterproof material saved my gear during a sudden rainstorm. Love the sleek design and all the pockets. Definitely worth the investment for outdoor adventures.',
  },
  {
    name: 'Robert Fox',
    date: '1 week ago',
    rating: 4,
    avatar:
      'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/avatars/avatar-ronald.png',
    comment:
      'Great quality backpack with excellent durability. The design is stylish and functional for both work and travel. Only wish it had one more external pocket, but overall very satisfied with this purchase.',
  },
]);
</script>
