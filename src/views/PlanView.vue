<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlanMap } from '@/composables/plan/usePlanMap';
import { Command, CommandInput } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref } from 'vue';

const { initMap } = usePlanMap();

onMounted(() => {
  initMap();
});

const query = ref('');
const places = ref<google.maps.places.Place[]>([]);

async function searchPlaces() {
  const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;

  const request = {
    textQuery: query.value,
    fields: ['displayName', 'location'],
    region: 'kr',
    maxResultCount: 20,
    language: 'ko',
  };

  const response = await Place.searchByText(request);
  places.value = response?.places || [];
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center gap-4 bg-gray-100">
    <!-- <div class="flex w-full max-w-sm items-center gap-1.5">
      <Input id="search" type="text" placeholder="장소를 입력하세요..." />
      <Button type="submit">Subscribe</Button>
    </div> -->
    <div class="p-4">
      <div class="flex h-12 w-full max-w-sm items-center gap-1.5">
        <Command class="h-full">
          <CommandInput v-model="query" placeholder="검색어를 입력하세요" />
        </Command>
        <Button class="h-full" @click="searchPlaces">검색</Button>
      </div>

      <ScrollArea class="mt-4 h-64 overflow-auto rounded border">
        <ul v-if="places.length">
          <li v-for="place in places" :key="place.id" class="border-b p-2">
            <div class="font-semibold">{{ place.displayName }}</div>
            <div class="text-sm text-gray-500">
              {{ place.location?.lat() }}, {{ place.location?.lng() }}
            </div>
          </li>
        </ul>
        <p v-else class="text-center text-gray-400">검색 결과가 없습니다.</p>
      </ScrollArea>
    </div>
    <div id="map" style="width: 50%; height: 500px"></div>
  </div>
</template>
