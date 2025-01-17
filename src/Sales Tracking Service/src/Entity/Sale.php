<?php
namespace App\Entity;

class Sale {
    private int $id;
    private string $customerName;
    private float $amount;
    private string $status;
    private \DateTime $createdAt;

    public function getId(): int { return $this->id; }
    public function getCustomerName(): string { return $this->customerName; }
    public function setCustomerName(string $name): void { $this->customerName = $name; }
    public function getAmount(): float { return $this->amount; }
    public function setAmount(float $amount): void { $this->amount = $amount; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): void { $this->status = $status; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
