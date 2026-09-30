import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { goalReducer, type GoalOptimisticAction } from '../../src/components/GoalList';
import type { Goal } from '../../src/db/schema';

function makeGoal(id: string, title: string, position: string): Goal {
  return {
    id,
    userId: 'user_123',
    userEmail: 'user@example.com',
    title,
    status: 'active',
    priority: 'none',
    position,
    isPinned: false,
    createdAt: '2026-09-30T10:00:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z',
    archivedAt: null,
  };
}

describe('Goal Optimistic Reducer', () => {
  it('should handle "create" action and maintain position order', () => {
    const initialState: Goal[] = [
      makeGoal('1', 'First Goal', 'a0'),
      makeGoal('3', 'Third Goal', 'a2'),
    ];

    const newGoal = makeGoal('2', 'Second Goal', 'a1');
    const action: GoalOptimisticAction = { type: 'create', goal: newGoal };

    const result = goalReducer(initialState, action);

    assert.equal(result.length, 3);
    assert.deepEqual(result.map((g) => g.id), ['1', '2', '3']);
    assert.equal(result[1].title, 'Second Goal');
  });

  it('should handle "update" action for title, priority, and status', () => {
    const initialState: Goal[] = [
      makeGoal('1', 'Old Title', 'a0'),
      makeGoal('2', 'Another Goal', 'a1'),
    ];

    const action: GoalOptimisticAction = {
      type: 'update',
      id: '1',
      data: { title: 'Updated Title', priority: 'high' },
    };

    const result = goalReducer(initialState, action);

    assert.equal(result.length, 2);
    assert.equal(result[0].title, 'Updated Title');
    assert.equal(result[0].priority, 'high');
    assert.equal(result[1].title, 'Another Goal');
  });

  it('should handle "remove" action', () => {
    const initialState: Goal[] = [
      makeGoal('1', 'Goal 1', 'a0'),
      makeGoal('2', 'Goal 2', 'a1'),
      makeGoal('3', 'Goal 3', 'a2'),
    ];

    const action: GoalOptimisticAction = { type: 'remove', id: '2' };
    const result = goalReducer(initialState, action);

    assert.equal(result.length, 2);
    assert.deepEqual(result.map((g) => g.id), ['1', '3']);
  });

  it('should handle "reorder" action and sort by new position', () => {
    const initialState: Goal[] = [
      makeGoal('1', 'Goal 1', 'a0'),
      makeGoal('2', 'Goal 2', 'a1'),
      makeGoal('3', 'Goal 3', 'a2'),
    ];

    // Move Goal 3 to before Goal 1 with position 'Zz' (which sorts before 'a0')
    const action: GoalOptimisticAction = {
      type: 'reorder',
      id: '3',
      position: 'Zz',
    };

    const result = goalReducer(initialState, action);

    assert.equal(result.length, 3);
    assert.deepEqual(result.map((g) => g.id), ['3', '1', '2']);
    assert.equal(result[0].position, 'Zz');
  });

  it('should handle "setList" action replacing entire list', () => {
    const initialState: Goal[] = [makeGoal('1', 'Goal 1', 'a0')];
    const newList: Goal[] = [
      makeGoal('10', 'Replaced Goal 10', 'b0'),
      makeGoal('11', 'Replaced Goal 11', 'b1'),
    ];

    const action: GoalOptimisticAction = { type: 'setList', goals: newList };
    const result = goalReducer(initialState, action);

    assert.equal(result.length, 2);
    assert.deepEqual(result, newList);
  });
});
