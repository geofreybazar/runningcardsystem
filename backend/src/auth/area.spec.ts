import { areaCityIds, dispatchCityId, officeCityId, type Office } from './area.js';

const manila = [{ id: 1, name: 'Manila', districtId: 1 }];
const fd2 = [
  { id: 2, name: 'Caloocan', districtId: 2 },
  { id: 3, name: 'Malabon', districtId: 2 },
];
const office = (o: Partial<Office>): Office => ({ role: 'RADIO_OPERATOR', officeLevel: 'REGIONAL', districtId: null, cityId: null, ...o });

describe('office areas', () => {
  it('city radio dispatches its own city', () => {
    const o = office({ officeLevel: 'CITY', districtId: 2, cityId: 2 });
    expect(dispatchCityId(o, fd2)).toBe(2);
    expect(areaCityIds(o, fd2)).toEqual([2]);
  });

  it('FD1/FD5 district radio dispatches its single city; other districts only watch', () => {
    expect(dispatchCityId(office({ officeLevel: 'DISTRICT', districtId: 1 }), manila)).toBe(1);
    expect(dispatchCityId(office({ officeLevel: 'DISTRICT', districtId: 2 }), fd2)).toBeNull();
    expect(areaCityIds(office({ officeLevel: 'DISTRICT', districtId: 2 }), fd2)).toEqual([2, 3]);
  });

  it('regional radio watches everything and dispatches nothing', () => {
    expect(dispatchCityId(office({}), [])).toBeNull();
    expect(areaCityIds(office({}), [])).toBeNull();
  });

  it('the city an office runs: city offices and FD1/FD5, not FD II-IV or Regional', () => {
    const ops = (o: Partial<Office>) => office({ role: 'OPERATIONS', ...o });
    expect(officeCityId(ops({ officeLevel: 'CITY', districtId: 2, cityId: 3 }), fd2)).toBe(3);
    expect(officeCityId(ops({ officeLevel: 'DISTRICT', districtId: 1 }), manila)).toBe(1);
    expect(officeCityId(ops({ officeLevel: 'DISTRICT', districtId: 2 }), fd2)).toBeNull();
    expect(officeCityId(ops({}), [])).toBeNull();
  });

  it('only radio operators dispatch', () => {
    expect(dispatchCityId(office({ role: 'OPERATIONS', officeLevel: 'CITY', cityId: 2 }), fd2)).toBeNull();
  });
});
