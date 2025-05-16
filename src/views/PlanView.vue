<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { usePlanMap } from '@/composables/plan/usePlanMap';
import { Command, CommandInput } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type PlaceResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
};

const { initMap, moveToPlace } = usePlanMap();

onMounted(() => {
  initMap();
});

const query = ref('');
const places = ref<PlaceResult[]>([]);

async function searchPlaces() {
  const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;

  const request = {
    textQuery: query.value,
    fields: ['displayName', 'location', 'formattedAddress', 'photos'],
    region: 'kr',
    maxResultCount: 20,
    language: 'ko',
  };

  const response = await Place.searchByText(request);

  places.value = (response?.places || []).map(p => ({
    name: p.displayName ?? '',
    address: p.formattedAddress ?? '',
    lat: p.location?.lat() ?? 0,
    lng: p.location?.lng() ?? 0,
    photoUrl: p.photos?.[0]?.getURI({ maxWidth: 400 }) ?? '',
  }));
}

function handlePlaceClick(place: PlaceResult) {
  moveToPlace(place.lat, place.lng, place.name);
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-start gap-4 bg-gray-100 p-6">
    <div class="flex w-full flex-col items-center gap-5">
      <div class="flex w-full items-center gap-2">
        <Command>
          <CommandInput v-model="query" placeholder="장소 검색..." />
        </Command>
        <Button @click="searchPlaces">검색</Button>
      </div>

      <ScrollArea class="w-full max-w-2xl">
        <div
          v-for="(place, index) in places"
          :key="index"
          @click="handlePlaceClick(place)"
          class="mb-2 flex items-center gap-4 rounded-lg border bg-white p-3 shadow"
        >
          <img
            v-if="place.photoUrl"
            :src="place.photoUrl"
            alt="장소 이미지"
            class="h-24 w-24 rounded object-cover"
          />

          <div>
            <div class="text-lg font-semibold">{{ place.name }}</div>
            <div class="text-sm text-gray-600">{{ place.address }}</div>
          </div>
        </div>
      </ScrollArea>
    </div>

    <div id="map" class="mt-6 h-[400px] w-full rounded-lg shadow" />
  </div>
</template>
