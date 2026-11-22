-- Run once in Supabase SQL Editor.
-- One atomic authoring operation, using the authenticated user's JWT.
create or replace function public.cbt_save_exam_question(
  p_exam_id uuid,
  p_section_id uuid,
  p_topic_id uuid,
  p_prompt text,
  p_options jsonb,
  p_correct_key text,
  p_explanation text default null,
  p_points numeric default 1,
  p_difficulty text default 'medium'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exam record;
  v_question_id uuid;
  v_version_id uuid;
  v_option_id uuid;
  v_rule_id uuid;
  v_key text;
  v_body text;
  v_position integer;
  v_count integer;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Please sign in again';
  end if;

  -- Lock the examination while assigning section positions.
  select id, organization_id, default_bank_id, default_category_id, created_by
    into v_exam
  from public.cbt_exams
  where id = p_exam_id and status = 'draft'
  for update;

  if not found then
    raise exception 'Draft examination not found';
  end if;

  if not exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles mr
      on mr.organization_id = m.organization_id
     and mr.membership_id = m.id
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = v_exam.organization_id
      and m.user_id = v_user
      and m.status = 'active'
      and o.status = 'active'
      and (
        mr.role_code in ('owner', 'admin')
        or (mr.role_code = 'examiner' and v_exam.created_by = v_user)
      )
  ) then
    raise exception 'You cannot edit this examination';
  end if;

  if v_exam.default_bank_id is null or v_exam.default_category_id is null then
    raise exception 'Set a question bank and subject first';
  end if;

  if not exists (
    select 1 from public.cbt_exam_sections
    where organization_id = v_exam.organization_id
      and exam_id = p_exam_id and id = p_section_id
  ) then
    raise exception 'Select a valid examination section';
  end if;

  if p_topic_id is not null and not exists (
    select 1 from public.cbt_topics
    where organization_id = v_exam.organization_id
      and bank_id = v_exam.default_bank_id
      and category_id = v_exam.default_category_id
      and id = p_topic_id
  ) then
    raise exception 'Selected topic does not belong to this subject';
  end if;

  if nullif(btrim(p_prompt), '') is null
      or p_difficulty not in ('easy', 'medium', 'hard')
      or p_points is null or p_points < 0
      or p_correct_key not in ('a', 'b', 'c', 'd')
      or jsonb_typeof(p_options) is distinct from 'array'
      or jsonb_array_length(p_options) <> 4 then
    raise exception 'Check the question, marks and answer choices';
  end if;

  -- Exactly four named options, one for each key.
  select count(distinct item->>'key') into v_count
  from jsonb_array_elements(p_options) item
  where item->>'key' in ('a', 'b', 'c', 'd')
    and nullif(btrim(item->>'body'), '') is not null;

  if v_count <> 4 then
    raise exception 'Enter four valid answer options';
  end if;

  insert into public.cbt_questions (
    organization_id, bank_id, category_id, topic_id, created_by
  ) values (
    v_exam.organization_id, v_exam.default_bank_id,
    v_exam.default_category_id, p_topic_id, v_user
  ) returning id into v_question_id;

  insert into public.cbt_question_versions (
    organization_id, question_id, version_number, type,
    prompt, explanation, difficulty, default_points, created_by
  ) values (
    v_exam.organization_id, v_question_id, 1, 'single_choice',
    btrim(p_prompt), nullif(btrim(p_explanation), ''),
    p_difficulty, p_points, v_user
  ) returning id into v_version_id;

  for v_key, v_body in
    select item->>'key', btrim(item->>'body')
    from jsonb_array_elements(p_options) with ordinality as t(item, pos)
    order by pos
  loop
    insert into public.cbt_question_options (
      organization_id, version_id, option_key, body, display_order
    ) values (
      v_exam.organization_id, v_version_id, v_key, v_body,
      case v_key when 'a' then 1 when 'b' then 2 when 'c' then 3 else 4 end
    ) returning id into v_option_id;

    if v_key = p_correct_key then
      insert into private.cbt_correct_options (
        organization_id, version_id, option_id
      ) values (v_exam.organization_id, v_version_id, v_option_id);
    end if;
  end loop;

  update public.cbt_question_versions
  set status = 'published', published_at = now()
  where organization_id = v_exam.organization_id and id = v_version_id;

  select coalesce(max(position), 0) + 1 into v_position
  from public.cbt_exam_question_rules
  where organization_id = v_exam.organization_id
    and section_id = p_section_id;

  insert into public.cbt_exam_question_rules (
    organization_id, exam_id, section_id, bank_id, category_id,
    kind, question_version_id, count_required, position
  ) values (
    v_exam.organization_id, p_exam_id, p_section_id,
    v_exam.default_bank_id, v_exam.default_category_id,
    'fixed', v_version_id, 1, v_position
  ) returning id into v_rule_id;

  return v_rule_id;
end;
$$;

revoke all on function public.cbt_save_exam_question(
  uuid, uuid, uuid, text, jsonb, text, text, numeric, text
) from public, anon;
grant execute on function public.cbt_save_exam_question(
  uuid, uuid, uuid, text, jsonb, text, text, numeric, text
) to authenticated;
