import { CheckIcon, Combobox, Group, Input, InputBase, Text, useCombobox } from '@mantine/core';
import { useState } from 'react';
import { Course } from '~/types/shared.types';
import { RiHtml5Line, RiCss3Line, RiJavascriptLine, RiReactjsLine, RiNextjsLine, RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';
import { RootState } from '~/store';
import { useDispatch, useSelector } from 'react-redux';
import { setCourse } from '~/store/features/globalSlice';

interface Item {
  icon: React.ReactNode;
  value: Course;
  label: string;
  active?: boolean;
}

const courses: Item[] = [
  { icon: <RiHtml5Line />, value: Course.HTML, label: 'HTML' },
  { icon: <RiCss3Line />, value: Course.CSS, label: 'CSS' },
  { icon: <RiJavascriptLine />, value: Course.JS, label: 'JavaScript' },
  { icon: <RiJavascriptLine />, value: Course.TS, label: 'TypeScript' },
  { icon: <RiReactjsLine />, value: Course.REACT, label: 'React' },
  { icon: <RiNextjsLine />, value: Course.NEXT, label: 'Next.js' },
];

function SelectOption({ icon, label, active }: Item) {
  return (
    <Group align='center' gap='xs' justify='space-between' w='100%'>
      <Text fz={20} c="gray.5" style={{ marginTop: 2 }}>{icon}</Text>
      <div style={{ flex: 1 }}>
        <Text fz="sm" fw={500}>
          {label}
        </Text>
      </div>
      {active && <Text fz="xs" c="gray.5"><RiCheckLine size={16} style={{ marginTop: 2 }} /></Text>}
    </Group>
  );
}

export function CoursePicker() {
  const selectedCourse = useSelector((state: RootState) => state.global.course);
  const dispatch = useDispatch();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const selectedOption = courses.find((item) => item.value === selectedCourse);

  const options = courses.map((item) => (
    <Combobox.Option value={item.value} key={item.value}>
      <SelectOption {...item} active={item.value === selectedCourse} />
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        dispatch(setCourse(val));
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          miw={200}
          component="button"
          type="button"
          pointer
          rightSection={<RiArrowDownSLine />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
          multiline
        >
          {selectedOption ? (
            <SelectOption {...selectedOption} />
          ) : (
            <Input.Placeholder>Pick a course</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}