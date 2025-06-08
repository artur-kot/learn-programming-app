import { Button, Group, Text } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { increment, decrement, incrementByAmount } from '../store/features/counterSlice';

export function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <div>
      <Text size="xl" fw={700} mb="md">
        Count: {count}
      </Text>
      <Group>
        <Button onClick={() => dispatch(decrement())}>-</Button>
        <Button onClick={() => dispatch(increment())}>+</Button>
        <Button onClick={() => dispatch(incrementByAmount(5))}>+5</Button>
      </Group>
    </div>
  );
}
