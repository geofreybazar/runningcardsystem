// Idempotent: safe to run again; it only adds what is missing.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import barangay from 'barangay';
import { PrismaPg } from '@prisma/adapter-pg';
import { PasswordHasher } from '@nestjs/authentication';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DISTRICTS = [
  { code: 1, name: 'Fire District 1', alias: 'Manila Fire District', color: '#fb923c', cities: ['Manila'] },
  { code: 2, name: 'Fire District 2', alias: 'CAMANAVA', color: '#3b82f6', cities: ['Caloocan', 'Malabon', 'Navotas', 'Valenzuela'] },
  { code: 3, name: 'Fire District 3', alias: null, color: '#eab308', cities: ['Pasay', 'Makati', 'Las Piñas', 'Parañaque', 'Muntinlupa'] },
  { code: 4, name: 'Fire District 4', alias: null, color: '#dc2626', cities: ['Marikina', 'Pasig', 'Pateros', 'Taguig', 'Mandaluyong', 'San Juan'] },
  { code: 5, name: 'Fire District 5', alias: 'Quezon City Fire District', color: '#22c55e', cities: ['Quezon City'] },
];

// City names as the `barangay` package spells them.
const PACKAGE_CITY: Record<string, string> = {
  Manila: 'CITY OF MANILA',
  Caloocan: 'CALOOCAN CITY',
  Malabon: 'CITY OF MALABON',
  Navotas: 'CITY OF NAVOTAS',
  Valenzuela: 'CITY OF VALENZUELA',
  Pasay: 'PASAY CITY',
  Makati: 'CITY OF MAKATI',
  'Las Piñas': 'CITY OF LAS PIÑAS',
  Parañaque: 'CITY OF PARAÑAQUE',
  Muntinlupa: 'CITY OF MUNTINLUPA',
  Marikina: 'CITY OF MARIKINA',
  Pasig: 'CITY OF PASIG',
  Pateros: 'PATEROS',
  Taguig: 'TAGUIG CITY',
  Mandaluyong: 'CITY OF MANDALUYONG',
  'San Juan': 'CITY OF SAN JUAN',
  'Quezon City': 'QUEZON CITY',
};

const ALARM_LEVELS = [
  '1st Alarm', '2nd Alarm', '3rd Alarm', '4th Alarm', '5th Alarm',
  'Task Force Alpha', 'Task Force Bravo', 'Task Force Charlie', 'Task Force Delta',
  'General Alarm',
];

type SeedStation = { name: string; lat: number; lng: number; districtCode: number };

async function main() {
  for (const d of DISTRICTS) {
    const { cities, ...data } = d;
    const district = await prisma.fireDistrict.upsert({ where: { code: d.code }, update: {}, create: data });
    for (const name of cities) {
      const city = await prisma.city.upsert({ where: { name }, update: {}, create: { name, districtId: district.id } });
      const names: string[] = barangay('NATIONAL CAPITAL REGION', 'METRO MANILA', PACKAGE_CITY[name]);
      await prisma.barangay.createMany({
        data: names.map((n) => ({ name: n, cityId: city.id })),
        skipDuplicates: true,
      });
    }
  }

  if ((await prisma.station.count()) === 0) {
    const stations: SeedStation[] = JSON.parse(readFileSync(new URL('./seed-data/stations.json', import.meta.url), 'utf8'));
    const districts = await prisma.fireDistrict.findMany({ include: { cities: true } });
    const byCode = new Map(districts.map((d) => [d.code, d]));
    const placeholderTrucks = process.env.SEED_PLACEHOLDER_TRUCKS === 'true';
    for (const s of stations) {
      const district = byCode.get(s.districtCode)!;
      await prisma.station.create({
        data: {
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          districtId: district.id,
          // FD1/FD5 are one city each; other stations get their city set by Operations.
          cityId: district.cities.length === 1 ? district.cities[0].id : null,
          trucks: placeholderTrucks ? { create: { callSign: `${s.name} Engine 1 (placeholder)` } } : undefined,
        },
      });
    }
  }

  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, alarmLevels: ALARM_LEVELS } });

  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (username && password && !(await prisma.user.findUnique({ where: { username } }))) {
    await prisma.user.create({
      data: {
        username,
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        passwordHash: await new PasswordHasher().hash(password),
        mustChangePassword: true,
      },
    });
  }

  console.log({
    districts: await prisma.fireDistrict.count(),
    cities: await prisma.city.count(),
    barangays: await prisma.barangay.count(),
    stations: await prisma.station.count(),
    trucks: await prisma.truck.count(),
    users: await prisma.user.count(),
  });
}

await main().finally(() => prisma.$disconnect());
