<?php

namespace Tests\Feature;

use App\Models\ClassBooking;
use App\Models\FitnessClass;
use App\Models\MemberProfile;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FitnessClassBookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-15 10:00:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function createRole(string $name): Role
    {
        return Role::firstOrCreate(['name' => $name], ['display_name' => ucfirst($name), 'description' => ucfirst($name)]);
    }

    private function createUserWithRole(string $roleName): array
    {
        $role = $this->createRole($roleName);
        $user = User::factory()->create(['status' => 'active']);
        $user->roles()->attach($role->id);
        $token = $user->createToken('test-token')->plainTextToken;

        return [$user, $token];
    }

    private function createMemberWithActivePass(): array
    {
        [$member, $token] = $this->createUserWithRole('member');

        MemberProfile::create([
            'user_id' => $member->id,
            'member_code' => 'TGT-TEST-01',
            'phone_number' => '+251911223344',
            'qr_code_token' => 'qr_token_test_01',
        ]);

        $plan = MembershipPlan::create([
            'name' => 'Monthly Unlimited',
            'duration_type' => 'month',
            'duration_value' => 1,
            'price' => 1500,
            'currency' => 'ETB',
            'is_active' => true,
        ]);

        Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-TEST-01',
            'start_date' => Carbon::now()->subDays(5),
            'end_date' => Carbon::now()->addDays(25),
            'status' => 'active',
            'price' => 1500,
            'total_amount' => 1500,
        ]);

        return [$member, $token];
    }

    public function test_cannot_book_after_class_has_started(): void
    {
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$member, $token] = $this->createMemberWithActivePass();

        // Class started 1 hour ago
        $pastClass = FitnessClass::create([
            'name' => 'Early Morning HIIT',
            'slug' => 'early-morning-hiit',
            'trainer_id' => $trainer->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->subHour(),
            'end_time' => Carbon::now()->subMinutes(10),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/classes/{$pastClass->id}/book", [
                'member_id' => $member->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonFragment([
                'message' => "Booking closed: Class \"Early Morning HIIT\" has already started or is not scheduled.",
            ]);

        $this->assertDatabaseMissing('class_bookings', [
            'fitness_class_id' => $pastClass->id,
            'member_id' => $member->id,
        ]);
    }

    public function test_can_book_future_class_with_active_pass(): void
    {
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$member, $token] = $this->createMemberWithActivePass();

        // Class scheduled 2 hours in future
        $futureClass = FitnessClass::create([
            'name' => 'Afternoon Power Spin',
            'slug' => 'afternoon-power-spin',
            'trainer_id' => $trainer->id,
            'room' => 'Studio B',
            'capacity' => 20,
            'start_time' => Carbon::now()->addHours(2),
            'end_time' => Carbon::now()->addHours(3),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/classes/{$futureClass->id}/book", [
                'member_id' => $member->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('class_bookings', [
            'fitness_class_id' => $futureClass->id,
            'member_id' => $member->id,
            'status' => 'reserved',
        ]);
    }

    public function test_booking_paid_class_with_cash_records_payment(): void
    {
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$receptionist, $token] = $this->createUserWithRole('receptionist');
        [$member, ] = $this->createMemberWithActivePass();

        $paidClass = FitnessClass::create([
            'name' => 'CrossFit Bootcamp Masterclass',
            'slug' => 'crossfit-bootcamp-masterclass',
            'trainer_id' => $trainer->id,
            'room' => 'Studio A',
            'capacity' => 15,
            'start_time' => Carbon::now()->addHours(4),
            'end_time' => Carbon::now()->addHours(5),
            'status' => 'scheduled',
            'price' => 250,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/classes/{$paidClass->id}/book", [
                'member_id' => $member->id,
                'payment_method' => 'cash',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $booking = ClassBooking::where('fitness_class_id', $paidClass->id)->where('member_id', $member->id)->first();
        $this->assertNotNull($booking);
        $this->assertNotNull($booking->payment_id);
        $this->assertEquals('reserved', $booking->status);

        $this->assertDatabaseHas('payments', [
            'user_id' => $member->id,
            'payable_type' => FitnessClass::class,
            'payable_id' => $paidClass->id,
            'amount' => 250,
            'payment_method' => 'cash',
            'payment_type' => 'class_fee',
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('payment_transactions', [
            'gateway' => 'manual',
            'amount' => 250,
            'status' => 'successful',
        ]);
    }

    public function test_booking_paid_class_with_chapa_records_payment_with_gateway_chapa(): void
    {
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$receptionist, $token] = $this->createUserWithRole('receptionist');
        [$member, ] = $this->createMemberWithActivePass();

        $paidClass = FitnessClass::create([
            'name' => 'Pilates Reformer Workshop',
            'slug' => 'pilates-reformer-workshop',
            'trainer_id' => $trainer->id,
            'room' => 'Studio C',
            'capacity' => 12,
            'start_time' => Carbon::now()->addHours(5),
            'end_time' => Carbon::now()->addHours(6),
            'status' => 'scheduled',
            'price' => 300,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/classes/{$paidClass->id}/book", [
                'member_id' => $member->id,
                'payment_method' => 'chapa',
                'payment_reference' => 'CHAPA-REF-TEST-9988',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('payments', [
            'user_id' => $member->id,
            'payable_type' => FitnessClass::class,
            'payable_id' => $paidClass->id,
            'amount' => 300,
            'payment_method' => 'chapa',
            'payment_type' => 'class_fee',
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('payment_transactions', [
            'gateway' => 'chapa',
            'gateway_reference' => 'CHAPA-REF-TEST-9988',
            'amount' => 300,
            'status' => 'successful',
        ]);
    }

    public function test_check_in_attendee_updates_status(): void
    {
        [$trainer, $token] = $this->createUserWithRole('trainer');
        [$member, ] = $this->createMemberWithActivePass();

        $class = FitnessClass::create([
            'name' => 'Morning HIIT',
            'slug' => 'morning-hiit-test',
            'trainer_id' => $trainer->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->addHour(),
            'end_time' => Carbon::now()->addHours(2),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $booking = ClassBooking::create([
            'fitness_class_id' => $class->id,
            'member_id' => $member->id,
            'status' => 'reserved',
            'booking_time' => Carbon::now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/classes/{$class->id}/bookings/{$booking->id}/check-in", [
                'status' => 'attended',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('class_bookings', [
            'id' => $booking->id,
            'status' => 'attended',
        ]);
    }

    public function test_staff_remove_booking_from_roster(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$member, ] = $this->createMemberWithActivePass();

        $class = FitnessClass::create([
            'name' => 'Spinning Pro',
            'slug' => 'spinning-pro-test',
            'trainer_id' => $trainer->id,
            'room' => 'Studio B',
            'capacity' => 15,
            'start_time' => Carbon::now()->addHours(3),
            'end_time' => Carbon::now()->addHours(4),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $booking = ClassBooking::create([
            'fitness_class_id' => $class->id,
            'member_id' => $member->id,
            'status' => 'reserved',
            'booking_time' => Carbon::now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/classes/{$class->id}/bookings/{$booking->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('class_bookings', [
            'id' => $booking->id,
        ]);
    }

    public function test_capacity_must_be_between_10_and_40(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');

        // Test capacity < 10 fails
        $resLow = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/classes', [
                'name' => 'Low Capacity Class',
                'trainer_id' => $trainer->id,
                'capacity' => 9,
                'start_time' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => Carbon::now()->addDay()->addHour()->format('Y-m-d H:i:s'),
                'price' => 0,
            ]);
        $resLow->assertStatus(422)
            ->assertJsonValidationErrors(['capacity']);

        // Test capacity > 40 fails
        $resHigh = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/classes', [
                'name' => 'High Capacity Class',
                'trainer_id' => $trainer->id,
                'capacity' => 45,
                'start_time' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => Carbon::now()->addDay()->addHour()->format('Y-m-d H:i:s'),
                'price' => 0,
            ]);
        $resHigh->assertStatus(422)
            ->assertJsonValidationErrors(['capacity']);

        // Test capacity = 20 succeeds
        $resValid = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/classes', [
                'name' => 'Valid Capacity Class',
                'trainer_id' => $trainer->id,
                'capacity' => 20,
                'start_time' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => Carbon::now()->addDay()->addHour()->format('Y-m-d H:i:s'),
                'price' => 0,
            ]);
        $resValid->assertStatus(201);
    }

    public function test_can_schedule_class_with_arbitrary_birr_fee_such_as_3_birr(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/classes', [
                'name' => 'Micro-Fee Class',
                'trainer_id' => $trainer->id,
                'capacity' => 15,
                'start_time' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => Carbon::now()->addDay()->addHour()->format('Y-m-d H:i:s'),
                'price' => 3,
            ]);

        $res->assertStatus(201);
        $this->assertEquals(3.0, (float) $res->json('data.price'));

        $this->assertDatabaseHas('fitness_classes', [
            'name' => 'Micro-Fee Class',
            'price' => 3,
        ]);
    }

    public function test_image_upload_data_url_does_not_fail_500_char_limit(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');

        // 1x1 transparent png in base64 data url (~100 chars or more)
        $dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/classes', [
                'name' => 'Photo Uploaded Class',
                'trainer_id' => $trainer->id,
                'capacity' => 25,
                'start_time' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => Carbon::now()->addDay()->addHour()->format('Y-m-d H:i:s'),
                'price' => 100,
                'image' => $dataUrl,
            ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('fitness_classes', [
            'name' => 'Photo Uploaded Class',
        ]);
    }

    public function test_class_status_is_automatically_managed_by_time(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');

        // Create class scheduled for now (ongoing)
        $ongoingClass = FitnessClass::create([
            'name' => 'Current Session',
            'slug' => 'current-session-' . uniqid(),
            'trainer_id' => $trainer->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->subMinutes(30),
            'end_time' => Carbon::now()->addMinutes(30),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        // Calling index should auto-sync status to ongoing
        $resIndex = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/classes');

        $resIndex->assertStatus(200);

        $this->assertDatabaseHas('fitness_classes', [
            'id' => $ongoingClass->id,
            'status' => 'ongoing',
        ]);
    }

    public function test_cannot_edit_or_cancel_started_or_completed_class(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');

        $startedClass = FitnessClass::create([
            'name' => 'Started Boxing Session',
            'slug' => 'started-boxing-' . uniqid(),
            'trainer_id' => $trainer->id,
            'room' => 'Studio B',
            'capacity' => 20,
            'start_time' => Carbon::now()->subMinutes(15),
            'end_time' => Carbon::now()->addMinutes(45),
            'status' => 'ongoing',
            'price' => 50,
        ]);

        // Trying to edit a started class should fail with 422
        $resEdit = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/classes/{$startedClass->id}", [
                'name' => 'Attempted Edit After Start',
            ]);

        $resEdit->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Cannot edit a class that has already started or completed.',
            ]);

        // Trying to cancel a started class should fail with 422
        $resCancel = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/classes/{$startedClass->id}", [
                'reason' => 'Emergency cancellation',
            ]);

        $resCancel->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Cannot cancel a class that has already started or completed.',
            ]);

        // Future class CAN be edited and cancelled
        $futureClass = FitnessClass::create([
            'name' => 'Future HIIT Masterclass',
            'slug' => 'future-hiit-' . uniqid(),
            'trainer_id' => $trainer->id,
            'room' => 'Studio A',
            'capacity' => 25,
            'start_time' => Carbon::now()->addHours(2),
            'end_time' => Carbon::now()->addHours(3),
            'status' => 'scheduled',
            'price' => 150,
        ]);

        $resFutureEdit = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/classes/{$futureClass->id}", [
                'name' => 'Future HIIT Masterclass Renamed',
                'capacity' => 30,
            ]);

        $resFutureEdit->assertStatus(200);
        $this->assertEquals('Future HIIT Masterclass Renamed', $futureClass->fresh()->name);

        $resFutureCancel = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/classes/{$futureClass->id}", [
                'reason' => 'Coach rescheduled',
            ]);

        $resFutureCancel->assertStatus(200);
        $this->assertEquals('cancelled', $futureClass->fresh()->status);
    }

    public function test_completed_non_recurring_classes_cleaned_up_after_48_hours(): void
    {
        [$trainer, ] = $this->createUserWithRole('trainer');

        // 1. Completed class ended 50 hours ago without recurrence (recurrence = 'none') -> should be removed
        $oldNonRecurring = FitnessClass::create([
            'name' => 'Old One-Off Pilates',
            'slug' => 'old-one-off-' . uniqid(),
            'trainer_id' => $trainer->id,
            'room' => 'Studio C',
            'capacity' => 15,
            'start_time' => Carbon::now()->subHours(51),
            'end_time' => Carbon::now()->subHours(50),
            'recurrence' => 'none',
            'status' => 'completed',
            'price' => 0,
        ]);

        // 2. Completed class ended 50 hours ago WITH recurrence ('weekly') -> should NOT be removed
        $oldRecurring = FitnessClass::create([
            'name' => 'Weekly Recurring Yoga',
            'slug' => 'weekly-yoga-' . uniqid(),
            'trainer_id' => $trainer->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->subHours(51),
            'end_time' => Carbon::now()->subHours(50),
            'recurrence' => 'weekly',
            'status' => 'completed',
            'price' => 100,
        ]);

        // 3. Completed class ended 24 hours ago without recurrence -> should NOT be removed (less than 48 hours)
        $recentCompleted = FitnessClass::create([
            'name' => 'Recent Yesterday Class',
            'slug' => 'recent-yesterday-' . uniqid(),
            'trainer_id' => $trainer->id,
            'room' => 'Studio B',
            'capacity' => 20,
            'start_time' => Carbon::now()->subHours(25),
            'end_time' => Carbon::now()->subHours(24),
            'recurrence' => 'none',
            'status' => 'completed',
            'price' => 50,
        ]);

        // Run the cleanup routine
        $cleaned = \App\Http\Controllers\Api\FitnessClassController::cleanupCompletedClasses();

        $this->assertGreaterThanOrEqual(1, $cleaned);

        // Assert old non-recurring is soft-deleted
        $this->assertSoftDeleted('fitness_classes', ['id' => $oldNonRecurring->id]);

        // Assert recurring class is NOT deleted
        $this->assertNotSoftDeleted('fitness_classes', ['id' => $oldRecurring->id]);

        // Assert recent class is NOT deleted
        $this->assertNotSoftDeleted('fitness_classes', ['id' => $recentCompleted->id]);
    }

    public function test_trainer_can_only_see_their_own_assigned_classes_in_index(): void
    {
        [$trainerA, $tokenA] = $this->createUserWithRole('trainer');
        [$trainerB, $tokenB] = $this->createUserWithRole('trainer');
        [$admin, $adminToken] = $this->createUserWithRole('admin');

        $classA = FitnessClass::create([
            'name' => 'Coach A Morning Yoga',
            'slug' => 'coach-a-yoga-' . uniqid(),
            'trainer_id' => $trainerA->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->addDay(),
            'end_time' => Carbon::now()->addDay()->addHour(),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $classB = FitnessClass::create([
            'name' => 'Coach B Power Lifting',
            'slug' => 'coach-b-lifting-' . uniqid(),
            'trainer_id' => $trainerB->id,
            'room' => 'Studio B',
            'capacity' => 15,
            'start_time' => Carbon::now()->addDay(),
            'end_time' => Carbon::now()->addDay()->addHour(),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        // Trainer A only sees their own assigned class
        $resA = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson('/api/classes');
        $resA->assertStatus(200);
        $idsA = collect($resA->json('data'))->pluck('id')->all();
        $this->assertContains($classA->id, $idsA);
        $this->assertNotContains($classB->id, $idsA);

        // Trainer A cannot bypass scoping by passing trainer_id parameter for another trainer
        $resABypass = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson("/api/classes?trainer_id={$trainerB->id}");
        $resABypass->assertStatus(200);
        $idsABypass = collect($resABypass->json('data'))->pluck('id')->all();
        $this->assertContains($classA->id, $idsABypass);
        $this->assertNotContains($classB->id, $idsABypass);

        // Switch to Trainer B
        $this->app['auth']->forgetGuards();

        // Trainer B only sees their own class
        $resB = $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->getJson('/api/classes');
        $resB->assertStatus(200);
        $idsB = collect($resB->json('data'))->pluck('id')->all();
        $this->assertContains($classB->id, $idsB);
        $this->assertNotContains($classA->id, $idsB);

        // Switch to Admin
        $this->app['auth']->forgetGuards();

        // Admin can see both classes
        $resAdmin = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/classes');
        $resAdmin->assertStatus(200);
        $idsAdmin = collect($resAdmin->json('data'))->pluck('id')->all();
        $this->assertContains($classA->id, $idsAdmin);
        $this->assertContains($classB->id, $idsAdmin);
    }

    public function test_trainer_cannot_view_other_trainers_class_details_or_roster(): void
    {
        [$trainerA, $tokenA] = $this->createUserWithRole('trainer');
        [$trainerB, $tokenB] = $this->createUserWithRole('trainer');
        [$member, ] = $this->createMemberWithActivePass();

        $classA = FitnessClass::create([
            'name' => 'Coach A Pilates',
            'slug' => 'coach-a-pilates-' . uniqid(),
            'trainer_id' => $trainerA->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->addDay(),
            'end_time' => Carbon::now()->addDay()->addHour(),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $classB = FitnessClass::create([
            'name' => 'Coach B Boxing',
            'slug' => 'coach-b-boxing-' . uniqid(),
            'trainer_id' => $trainerB->id,
            'room' => 'Studio B',
            'capacity' => 20,
            'start_time' => Carbon::now()->addDay(),
            'end_time' => Carbon::now()->addDay()->addHour(),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        $bookingA = ClassBooking::create([
            'fitness_class_id' => $classA->id,
            'member_id' => $member->id,
            'status' => 'reserved',
        ]);

        $bookingB = ClassBooking::create([
            'fitness_class_id' => $classB->id,
            'member_id' => $member->id,
            'status' => 'reserved',
        ]);

        // Trainer A viewing Class A details and roster: Allowed
        $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson("/api/classes/{$classA->id}")
            ->assertStatus(200);

        $resRosterA = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson("/api/classes/{$classA->id}/roster");
        $resRosterA->assertStatus(200);
        $this->assertEquals($member->id, $resRosterA->json('data.bookings.0.member.id'));

        // Trainer A viewing Class B details and roster: Forbidden (403)
        $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson("/api/classes/{$classB->id}")
            ->assertStatus(403);

        $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson("/api/classes/{$classB->id}/roster")
            ->assertStatus(403);

        // Trainer A updating attendance in Class B: Forbidden (403)
        $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->patchJson("/api/classes/{$classB->id}/bookings/{$bookingB->id}/check-in", ['status' => 'attended'])
            ->assertStatus(403);

        // Trainer A updating attendance in own Class A: Allowed (200)
        $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->patchJson("/api/classes/{$classA->id}/bookings/{$bookingA->id}/check-in", ['status' => 'attended'])
            ->assertStatus(200);
        $this->assertEquals('attended', $bookingA->fresh()->status);
    }

    public function test_trainer_stats_are_scoped_to_assigned_classes_only(): void
    {
        [$trainerA, $tokenA] = $this->createUserWithRole('trainer');
        [$trainerB, ] = $this->createUserWithRole('trainer');
        [$admin, $adminToken] = $this->createUserWithRole('admin');

        FitnessClass::create([
            'name' => 'Coach A Spinning',
            'slug' => 'coach-a-spin-' . uniqid(),
            'trainer_id' => $trainerA->id,
            'room' => 'Studio A',
            'capacity' => 20,
            'start_time' => Carbon::now()->addDay(),
            'end_time' => Carbon::now()->addDay()->addHour(),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        FitnessClass::create([
            'name' => 'Coach B Crossfit',
            'slug' => 'coach-b-crossfit-' . uniqid(),
            'trainer_id' => $trainerB->id,
            'room' => 'Studio B',
            'capacity' => 25,
            'start_time' => Carbon::now()->addDay(),
            'end_time' => Carbon::now()->addDay()->addHour(),
            'status' => 'scheduled',
            'price' => 0,
        ]);

        // Trainer A stats should only reflect Coach A's class
        $resStatsA = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->getJson('/api/classes/stats');
        $resStatsA->assertStatus(200);
        $this->assertEquals(1, $resStatsA->json('data.total_classes'));

        // Switch to Admin and flush cache
        $this->app['auth']->forgetGuards();
        \Illuminate\Support\Facades\Cache::flush();

        // Admin stats reflect all classes
        $resStatsAdmin = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/classes/stats');
        $resStatsAdmin->assertStatus(200);
        $this->assertGreaterThanOrEqual(2, $resStatsAdmin->json('data.total_classes'));
    }
}
